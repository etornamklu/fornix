from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response, Query
from loguru import logger
from sqlalchemy import func, extract, select
from sqlalchemy.orm import Session, aliased


from src.database.database_connection import get_db
from src.database.models.user import User, UserConnections
from src.controller.organization import create_organization_users, allocate_individual_credits, allocate_role_based_credits
from src.controller.auth import set_auth_cookie , create_token, admin_decode_token, decode_token
from src.database.models.organization import Organization, OrganizationInvitations
from src.database.schema.organization import OrganizationCreate, OrganizationUpdate, \
    OrganizationPublic, OrganizationInvitationCreate, CreditUsage, DistributeCreditsCreate
from src.database.schema.user import TokenData, UserSchema, UserRole

router = APIRouter(prefix="/organization")


@router.post("", response_model=OrganizationPublic)
async def create_organization(
        response: Response,
        organization: OrganizationCreate,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db)
):
    try:
        existing_organization = db.query(Organization).filter(Organization.owner_id == token_data.user_id).first()

        if existing_organization:
            logger.error(f"User {token_data.user_id} already has an organization.")
            raise HTTPException(status_code=400, detail="User already has an organization.")

        new_organization_id = uuid4()
        new_organization = Organization(**organization.model_dump(), owner_id=token_data.user_id, id=new_organization_id)

        owner = db.query(User).filter(User.id == token_data.user_id).first()
        owner.organization_id = new_organization_id

        db.add(new_organization)
        db.add(owner)

        logger.info(f"Creating organization with owner_id: {token_data.user_id}")
        db.commit()
        db.refresh(new_organization)
        db.refresh(owner)
        logger.info("Organization created successfully")
        created_token = create_token(owner)
        set_auth_cookie(response, created_token.access_token)
        return new_organization
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error creating organization: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=OrganizationPublic)
async def get_organization(
        token_data: TokenData = Depends(decode_token),
        db: Session = Depends(get_db)
):
    try:
        logger.info(token_data.organization_id)
        organization = db.query(Organization).filter(Organization.id == token_data.organization_id).first()
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        logger.info("Fetched organization successfully")
        return organization
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users", response_model=list[UserSchema])
async def get_organization_users(
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db),
        role : UserRole | None = None,
        limit: int = 100,
        offset: int = 0
):
    try:
        query = db.query(User).filter(User.organization_id == token_data.organization_id)
        if role:
            query = query.filter(User.role == role.value).limit(limit).offset(offset)
        users = query.all()
        if not users:
            raise HTTPException(status_code=404, detail="No users found for this organization")
        logger.info("Fetched organization users successfully")
        return users
    except Exception as e:
        logger.error(f"Error fetching organization users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credits/allocate", response_model=dict)
async def distribute_organization_credits(
        distribution: DistributeCreditsCreate,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db),
        background_tasks: BackgroundTasks = BackgroundTasks
):
    try:
        organization = db.query(Organization).filter(
            Organization.id == token_data.organization_id
        ).first()

        credit_usage_type = organization.credit_usage_type

        if credit_usage_type == CreditUsage.pool.value:
            raise HTTPException(
                status_code=400,
                detail="Organization uses pooled credits; distribution not applicable."
            )

        print(credit_usage_type)

        # Determine which users to target
        if credit_usage_type.value == CreditUsage.role.value:
            #Fetch only users whose roles appear in the role_credit dict
            role_keys = list(distribution.role_credit.model_dump().keys())
            role_keys = [key.upper() for key in role_keys]
            user_ids = (
                db.execute(select(User.id).filter(
                    User.organization_id == token_data.organization_id,
                    User.role.in_(role_keys)))
                .scalars().all()
            )

            logger.info(role_keys)

            #Calculate total credits needed
            total_required_credits = sum(
                distribution.role_credit.model_dump().get(user.role.lower(), 0)
                for user in db.query(User.role).filter(User.id.in_(user_ids)).all()
            )
            logger.info(total_required_credits)

        else:
            print("bread")
            # Distribute fixed amount to everyone in org
            user_ids = db.execute(
                select(User.id).filter(User.organization_id == token_data.organization_id)
            ).scalars().all()
            total_required_credits = distribution.user * len(user_ids)

        #Check organization balance
        if organization.credits < total_required_credits:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient organization credits. "
                    f"Available: {organization.credits}, "
                    f"Required: {total_required_credits}"
                )
            )

        #Deduct upfront (to prevent double allocation in race conditions)
        organization.credits -= total_required_credits
        db.commit()

        #Schedule background distribution task
        if credit_usage_type.value == CreditUsage.role.value:
            background_tasks.add_task(
                allocate_role_based_credits,
                token_data.organization_id,
                user_ids,
                distribution.role_credit
            )
        else:
            background_tasks.add_task(
                allocate_individual_credits,
                token_data.organization_id,
                user_ids,
                distribution.user
            )

        logger.info(
            f"Scheduled background credit distribution for org {token_data.organization_id} "
            f"({len(user_ids)} users, {total_required_credits} total credits)"
        )

        return {
            "message": (
                "Credit distribution is being processed in the background."
            ),
            "total_required_credits": total_required_credits,
            "remaining_org_credits": organization.credits
        }

    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error distributing credits: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/credits", response_model=dict)
async def distribute_organization_credits_individual(
        user_id: UUID = Query(..., description="ID of the user to distribute credits to"),
        credits: float = Query(..., gt=0, description="Number of credits to distribute"),
        allocate: bool = True,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db)
):
    try:
        organization = db.query(Organization).filter(Organization.id == token_data.organization_id).first()
        user = db.query(User).filter(User.id == user_id, User.organization_id == token_data.organization_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found in this organization")
        if allocate:
            user.credits += credits
            organization.credits -= credits
        else:
            user.credits -= credits
            organization.credits += credits

        db.commit()
        logger.info(f"Distributed {credits} credits to user {user_id}")
        return {"message": f"Distributed {credits} credits to user {user_id}"}

    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error distributing credits: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/count")
async def get_organization_user_count(
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db),
        role: UserRole | None = None,
        last_month: bool = False,
        year: int | None = None
):
    try:
        query = db.query(User).filter(User.organization_id == token_data.organization_id)

        if role:
            query = query.filter(User.role == role.value)

        if last_month and year:
            raise HTTPException(status_code=400, detail="Cannot use last month and year filters together.")

        if last_month:
            now = datetime.now(timezone.utc)
            start = now - timedelta(days=30)
            count = query.filter(User.created_at >= start).count()
            return {"count": count}

        if year:
            results = (
                db.query(
                    extract("month", User.created_at).label("month"),
                    func.count(User.id).label("count"),
                )
                .filter(User.organization_id == token_data.organization_id)
                .filter(extract("year", User.created_at) == year)
                .group_by("month")
                .order_by("month")
                .all()
            )

            monthly_counts = {int(row.month): row.count for row in results}
            return {"year": year, "counts": monthly_counts}

        count = query.count()
        return {"count": count}

    except Exception as e:
        logger.error(f"Error fetching organization users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/doc-patient")
async def get_organization_doc_patient(
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db),
        limit: int = 100,
        offset: int = 0,
):
    try:
        Doctor = aliased(User)
        Patient = aliased(User)

        results = (
            db.query(
                UserConnections.id,
                Doctor.name.label("doctor_name"),
                Doctor.role.label("doctor_role"),
                Patient.name.label("patient_name"),
                UserConnections.receiver_id,
                UserConnections.connection_status,
            )
            .join(Doctor, UserConnections.sender_id == Doctor.id)
            .join(Patient, UserConnections.receiver_id == Patient.id)
            .filter(Doctor.organization_id == token_data.organization_id)
            .limit(limit)
            .offset(offset)
            .all()
        )

        connections = [
            {
                "id": row.id,
                "doctor_name": row.doctor_name,
                "department" : row.doctor_role,
                "patient_name": row.patient_name,
                "patient_id": row.receiver_id,
                "connection_status": row.connection_status.value
            }
            for row in results
        ]
        return connections

    except Exception as e:
        logger.error(f"Error fetching organization users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}", response_model=dict)
async def delete_organization_user(
        user_id: UUID,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db)
):
    try:
        user= (
            db.query(User)
            .filter(User.organization_id == token_data.organization_id,
                    User.id == user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail=f"No user with {id=} found for this organization")
        logger.info("Fetched organization users successfully")
        db.delete(user)
        db.commit()
        logger.info(f"Deleted user {user_id} successfully")
        return {"message": f"User {user_id} deleted successfully" }
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error creating organization: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("", response_model=OrganizationPublic)
async def update_organization(
        organization_update: OrganizationUpdate,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db)
):
    try:
        organization = db.query(Organization).filter(Organization.id == token_data.organization_id).first()
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")

        for key, value in organization_update.model_dump().items():
            if value is not None:
                setattr(organization, key, value)

        db.commit()
        db.refresh(organization)
        return organization

    except Exception as e:
        logger.error(f"Error updating organization: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/invitations")
async def create_organization(
        invitations: list[OrganizationInvitationCreate],
        background_tasks: BackgroundTasks,
        token_data: TokenData = Depends(admin_decode_token),
        db: Session = Depends(get_db)
):
    try:
        organization_id = token_data.organization_id
        organization = (
            db.query(Organization)
            .filter(
                Organization.id == organization_id,
            )
            .first()
        )

        if not organization:
            logger.error(f"Organization with ID {organization_id} not found or user does not have permission.")
            raise HTTPException(status_code=400, detail="Organization not found or user does not have permission.")


        new_invitations = [
            OrganizationInvitations(
                organization_id=organization_id,
                user_email=invitation.email,
                user_role=invitation.role
            )
            for invitation in invitations

        ]
        logger.info(f"Creating organization with owner_id: {token_data.user_id}")
        db.add_all(new_invitations)
        db.commit()

        logger.info("Organization created successfully")
        background_tasks.add_task(create_organization_users, invitations, organization_id)

        return {"message": "Organization users are being created in the background."}
    except HTTPException as e:
        logger.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error creating organization: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

