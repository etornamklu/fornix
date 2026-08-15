import secrets
from uuid import UUID
from sqlalchemy.orm import Session

from src.database.schema.user import UserCreate
from src.controller.auth import create_org_user
from src.database.database_connection import SessionLocal
from src.database.models import Organization, User
from src.database.schema.organization import OrganizationInvitationCreate, RoleCredit
from src.services.email import send_org_welcome_email

def create_organization_users(
        org_users: list[OrganizationInvitationCreate],
        org_id:UUID,
):
    db: Session = SessionLocal()
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    """
    Create users for the organization.
    :param org_users: List of organization users to be created.
    :param db: Database session.
    :param org_id: UUID of the organization.
    """

    try:
        for user in org_users:
            existing_user = db.query(User).filter(User.email == user.email, User.organization_id == org_id).first()
            if existing_user:
                print(f"User with email {user.email} already exists in organization {org_id}. Skipping creation.")
                continue
            password = secrets.token_hex(6)
            print(f"User password: {password}")
            new_user = UserCreate(
                organization_id=org_id,
                role=user.role,
                name=user.name,
                email=user.email,
                password=password
            )
            create_org_user(db=db, user=new_user)
            try:
                send_org_welcome_email(email=user.email, password=password, org_name=organization.name)
            except Exception as e:
                print(e)

    except Exception as e:
        raise Exception(f"Error creating organization users: {e}")
    finally:
        db.close()
        print("Database session closed.")


def allocate_role_based_credits(
        org_id:UUID,
        user_ids: list[UUID],
        role_credit: RoleCredit,
):
    db: Session = SessionLocal()

    try:
        role_credit = role_credit.model_dump()
        print(user_ids)
        for user_id in user_ids:
            print("starting")
            user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
            if not user:
                raise Exception(f"User with ID {user_id} not found in organization {org_id}")
            role_credits = role_credit.get(user.role.lower(), 0)
            user.credits += role_credits
            print(f"Allocated {role_credits} credits to user {user.email} with role {user.role}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise Exception(f"Error allocating organization credits: {e}")
    finally:
        db.close()
        print("Database session closed.")


def allocate_individual_credits(
        org_id:UUID,
        user_ids: list[UUID],
        credits: float,
):
    db: Session = SessionLocal()

    try:
        for user_id in user_ids:
            user = db.query(User).filter(User.id == user_id, User.organization_id == org_id).first()
            if not user:
                raise Exception(f"User with ID {user_id} not found in organization {org_id}")
            user.credits += credits
            print(f"Allocated {credits} credits to user {user.email} with role {user.role}")
        db.commit()
    except Exception as e:
        db.rollback()
        raise Exception(f"Error allocating organization credits: {e}")
    finally:
        db.close()
        print("Database session closed.")