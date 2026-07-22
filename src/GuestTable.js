import { useEffect, useMemo, useState } from "react";

import {
    collection,
    getDocs,
    orderBy,
    query,
} from "firebase/firestore";

import { db } from "./firebase";

import {
    Alert,
    Box,
    CircularProgress,
    Grid,
    Paper,
    Typography,
} from "@mui/material";
import "./guest.css";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const columns = [
    {
        field: "name",
        headerName: "Guest Name",
        flex: 1,
        minWidth: 170,
    },
    {
        field: "guests",
        headerName: "Guests",
        type: "number",
        width: 100,
    },
    {
        field: "attending",
        headerName: "Attending",
        width: 140,
    },
    {
        field: "totalMarriage",
        headerName: "Marriage",
        type: "number",
        width: 120,
    },
    {
        field: "totalReception",
        headerName: "Reception",
        type: "number",
        width: 120,
    },
    {
        field: "message",
        headerName: "Message",
        flex: 1.5,
        minWidth: 220,
    },
    {
        field: "createdAt",
        headerName: "Submitted On",
        width: 190,
    },
];

function GuestTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchGuests();
    }, []);

    const fetchGuests = async () => {
        try {
            setLoading(true);
            setError("");

            const guestsQuery = query(
                collection(db, "rsvps"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(guestsQuery);

            const guestData = snapshot.docs.map((document) => {
                const value = document.data();

                const guestCount = Number(value.guests) || 0;

                const attendance = String(value.attending || "")
                    .trim()
                    .toLowerCase();

                const isMarriage =
                    attendance === "marriage" ||
                    attendance === "wedding" ||
                    attendance === "both";

                const isReception =
                    attendance === "reception" || attendance === "both";

                return {
                    id: document.id,
                    ...value,
                    guests: guestCount,
                    attending: value.attending || "-",
                    message: value.message || "-",

                    totalMarriage: isMarriage ? guestCount : 0,
                    totalReception: isReception ? guestCount : 0,

                    createdAt: value.createdAt?.toDate
                        ? value.createdAt.toDate().toLocaleString()
                        : "-",
                };
            });

            setRows(guestData);
        } catch (fetchError) {
            console.error("Error fetching RSVPs:", fetchError);

            setError(
                "Unable to load RSVP records. Please check your Firebase configuration and Firestore permissions."
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadResponsesPDF = () => {
        if (rows.length === 0) {
            return;
        }

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        // Main heading
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(68, 49, 42);

        doc.text("Wedding RSVP Responses", pageWidth / 2, 16, {
            align: "center",
        });

        // Generated date
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(120, 105, 98);

        doc.text(
            `Downloaded on: ${new Date().toLocaleString()}`,
            pageWidth / 2,
            22,
            {
                align: "center",
            }
        );

        // Summary section
        doc.setFillColor(248, 242, 237);
        doc.roundedRect(14, 28, pageWidth - 28, 20, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(89, 64, 55);

        doc.text(`Total RSVP Responses: ${totals.responses}`, 22, 40);
        doc.text(`Marriage Guests: ${totals.marriage}`, 100, 40);
        doc.text(`Reception Guests: ${totals.reception}`, 170, 40);

        const tableRows = rows.map((row, index) => [
            index + 1,
            row.name || "-",
            row.guests || 0,
            row.attending || "-",
            row.totalMarriage || 0,
            row.totalReception || 0,
            row.message || "-",
            row.createdAt || "-",
        ]);

        autoTable(doc, {
            startY: 55,

            head: [
                [
                    "No.",
                    "Guest Name",
                    "Guests",
                    "Attending",
                    "Marriage",
                    "Reception",
                    "Message",
                    "Submitted On",
                ],
            ],

            body: tableRows,

            theme: "grid",

            styles: {
                font: "helvetica",
                fontSize: 8,
                cellPadding: 3,
                valign: "middle",
                overflow: "linebreak",
                lineColor: [232, 221, 214],
                lineWidth: 0.2,
                textColor: [75, 58, 51],
            },

            headStyles: {
                fillColor: [101, 70, 58],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center",
                cellPadding: 4,
            },

            alternateRowStyles: {
                fillColor: [252, 248, 245],
            },

            columnStyles: {
                0: {
                    cellWidth: 12,
                    halign: "center",
                },
                1: {
                    cellWidth: 38,
                },
                2: {
                    cellWidth: 18,
                    halign: "center",
                },
                3: {
                    cellWidth: 27,
                    halign: "center",
                },
                4: {
                    cellWidth: 22,
                    halign: "center",
                },
                5: {
                    cellWidth: 22,
                    halign: "center",
                },
                6: {
                    cellWidth: 68,
                },
                7: {
                    cellWidth: 40,
                },
            },

            margin: {
                top: 15,
                right: 12,
                bottom: 18,
                left: 12,
            },

            didDrawPage: (data) => {
                const currentPage = doc.internal.getNumberOfPages();
                const pageHeight = doc.internal.pageSize.getHeight();

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(140, 125, 117);

                doc.text(
                    `Page ${currentPage}`,
                    pageWidth / 2,
                    pageHeight - 8,
                    {
                        align: "center",
                    }
                );

                // Add heading to pages after the first page
                if (currentPage > 1) {
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(11);
                    doc.setTextColor(68, 49, 42);

                    doc.text(
                        "Wedding RSVP Responses",
                        pageWidth / 2,
                        9,
                        {
                            align: "center",
                        }
                    );
                }
            },
        });

        const currentDate = new Date()
            .toISOString()
            .split("T")[0];

        doc.save(`wedding-rsvp-responses-${currentDate}.pdf`);
    };

    const totals = useMemo(() => {
        return rows.reduce(
            (result, row) => {
                result.marriage += Number(row.totalMarriage) || 0;
                result.reception += Number(row.totalReception) || 0;
                result.responses += 1;

                return result;
            },
            {
                marriage: 0,
                reception: 0,
                responses: 0,
            }
        );
    }, [rows]);

    return (
        <Box className="guest-dashboard">
            <Box className="guest-dashboard-container">
                <Box className="dashboard-header">
                    <Typography className="dashboard-title">
                        Wedding RSVP Dashboard
                    </Typography>

                    <Typography className="dashboard-subtitle">
                        A complete overview of your marriage and reception guest
                        confirmations.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" className="dashboard-error">
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3} className="summary-grid">
                    <Grid item xs={12} sm={6} md={4}>
                        <Paper className="summary-card marriage-card">
                            <Box className="summary-card-top-line" />

                            <Typography className="summary-card-label">
                                Marriage Guests
                            </Typography>

                            <Typography className="summary-card-count">
                                {totals.marriage}
                            </Typography>

                            <Typography className="summary-card-description">
                                Confirmed guests attending the marriage
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Paper className="summary-card reception-card">
                            <Box className="summary-card-top-line" />

                            <Typography className="summary-card-label">
                                Reception Guests
                            </Typography>

                            <Typography className="summary-card-count">
                                {totals.reception}
                            </Typography>

                            <Typography className="summary-card-description">
                                Confirmed guests attending the reception
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Paper className="summary-card responses-card">
                            <Box className="summary-card-top-line" />

                            <Typography className="summary-card-label">
                                RSVP Responses
                            </Typography>

                            <Typography className="summary-card-count">
                                {totals.responses}
                            </Typography>

                            <Typography className="summary-card-description">
                                Total RSVP forms submitted
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Paper className="table-paper">
                    <Box className="table-header-section">
                        <Box>
                            <Typography className="table-section-title">
                                Guest Responses
                            </Typography>
                        </Box>
                        <Button
                            className="download-pdf-button"
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={downloadResponsesPDF}
                            disabled={loading || rows.length === 0}
                        >
                            Download PDF
                        </Button>
                    </Box>

                    {loading ? (
                        <Box
                            className="dashboard-loader"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            gap={2}
                        >
                            <CircularProgress />

                            <Typography className="dashboard-loader-text">
                                Loading RSVP responses...
                            </Typography>
                        </Box>
                    ) : (
                        <DataGrid
                            className="premium-data-grid"
                            rows={rows}
                            columns={columns}
                            autoHeight
                            disableRowSelectionOnClick
                            pageSizeOptions={[5, 10, 20, 50]}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        page: 0,
                                        pageSize: 10,
                                    },
                                },
                            }}
                        />
                    )}
                </Paper>
            </Box>
        </Box>
    );
}

export default GuestTable;