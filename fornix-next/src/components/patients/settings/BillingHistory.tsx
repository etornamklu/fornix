import React, { useState, useEffect } from "react";
import { DataGrid, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { fetchBillingHistory } from "../../../services/dashboard/billing.service";

const BillingHistory: React.FC = () => {
    const [rows, setRows] = useState<GridRowsProp>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadBillingHistory = async () => {
            setLoading(true);

            try {
                const data = await fetchBillingHistory();
                if (data && data.length > 0) {
                    const formattedData = data.map((item: any, index: number) => ({
                        id: item.id,
                        No: index + 1,
                        Date: new Date(item.created_at).toLocaleDateString(),
                        Status: item.status.toLowerCase(),
                        Amount: `₵${item.amount.toFixed(2)}`,
                        Plan: item.plan,
                    }));
                    setRows(formattedData);
                } else {
                    setRows([]);  // Return an empty array when no data is present
                }
            } catch (err) {
                console.error("Error loading billing history:", err);
                setRows([]);  // Set an empty table if fetching fails
            } finally {
                setLoading(false);
            }
        };

        loadBillingHistory();
    }, []);

    const columns: GridColDef[] = [
        { field: "No", headerName: "No", width: 90 },
        { field: "Date", headerName: "Date", width: 150 },
        {
            field: "Status",
            headerName: "Status",
            width: 160,
            renderCell: (params) => {
                return (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "100%",
                            height: "100%",
                            padding: "4px 8px",
                            backgroundColor: params.value === "success" ? "#ECFDF3" : "transparent",
                            borderRadius: "100px",
                        }}
                    >
                        {params.value === "success" ? (
                            <>
                                <span
                                    style={{
                                        height: "8px",
                                        width: "8px",
                                        backgroundColor: "#028A0F",
                                        borderRadius: "50%",
                                        marginRight: "8px",
                                    }}
                                />
                                <span>{params.value.toUpperCase()}</span>
                            </>
                        ) : (
                            <span>{params.value}</span>
                        )}
                    </div>
                );
            },
        },
        { field: "Amount", headerName: "Amount", width: 150 },
        { field: "Plan", headerName: "Plan", width: 150 },
    ];

    if (loading) return <div>Loading...</div>;

    return (
        <div>
             <h3 className="text-3xl font-bold mb-[4px]">Billing History</h3>
            <div style={{ height: 400, width: "100%" }}>
                <DataGrid
                    rows={rows}  // Will display an empty table if `rows` is empty
                    columns={columns}
                    checkboxSelection
                />
            </div>
        </div>
    );
};

export default BillingHistory;
