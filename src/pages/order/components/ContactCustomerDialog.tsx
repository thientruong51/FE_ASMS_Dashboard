import { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Stack,
    Typography,
    IconButton,
    MenuItem,
} from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi";

type Props = {
    open: boolean;
    onClose: () => void;

    mode?: "create" | "update-images";

    contactId?: number | string;
    existingImages?: string[];

    orderCode?: string | null;
    customerCode?: string | null;
    customerName?: string | null;
    phoneContact?: string | null;
    email?: string | null;
    employeeCode?: string | null;

    onUpdated?: () => void;
};

export default function ContactCustomerDialog({
    open,
    onClose,
    mode = "create",
    contactId,
    existingImages,
    orderCode,
    customerCode,
    customerName,
    phoneContact,
    email,
    employeeCode,
    onUpdated,
}: Props) {
    const { t } = useTranslation("contact");

    const [message, setMessage] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [imgUploading, setImgUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    /* ================= Cloudinary ================= */
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

    const uploadFileToCloudinary = async (file: File): Promise<string> => {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", UPLOAD_PRESET);

        const resp = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
        if (!resp.ok) throw new Error("Cloudinary upload failed");

        const json = await resp.json();
        return json.secure_url ?? json.url;
    };
    const CONTACT_TYPE_OPTIONS = [
        { value: "damage report", i18nKey: "contactType.damage_report" },
        { value: "refund", i18nKey: "contactType.refund" },
        { value: "request to retrieve", i18nKey: "contactType.request_to_retrieve" },
    ];
    const [contactType, setContactType] = useState<string>("");
    const [orderDetailId, setOrderDetailId] = useState<string>("");
    /* ================= Effects ================= */
    useEffect(() => {
        if (mode === "update-images" && Array.isArray(existingImages)) {
            setImages(existingImages);
        }
    }, [mode, existingImages]);

    /* ================= Handlers ================= */
    const handleFilesSelected = (filesList: FileList | null) => {
        if (!filesList) return;
        const files = Array.from(filesList);
        setSelectedFiles(files);
        setPreviewImages(files.map((f) => URL.createObjectURL(f)));
    };

    const handleUploadImages = async () => {
        if (!selectedFiles?.length) return;

        setImgUploading(true);
        try {
            const uploaded = await Promise.all(selectedFiles.map(uploadFileToCloudinary));
            setImages((prev) => Array.from(new Set([...prev, ...uploaded])));
            previewImages.forEach(URL.revokeObjectURL);
            setPreviewImages([]);
            setSelectedFiles(null);
        } finally {
            setImgUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (
            contactType === "damage report" &&
            !orderDetailId
        ) {
            alert(
                t("errors.orderDetailRequired") ??
                "Order detail ID is required for damage report"
            );
            return;
        }
        setLoading(true);
        try {
            let finalImages = [...images];

            if (selectedFiles && selectedFiles.length > 0) {
                const uploaded = await Promise.all(
                    selectedFiles.map(uploadFileToCloudinary)
                );
                finalImages = Array.from(new Set([...finalImages, ...uploaded]));
            }


            if (
                mode === "create" &&
                contactType === "damage report" &&
                orderDetailId
            ) {
                await contactApi.markOrderDetailDamaged(
                    Number(orderDetailId)
                );
            }

            if (mode === "update-images") {
                if (!contactId) throw new Error("Missing contactId");

                await contactApi.updateContact(contactId, {
                    image: finalImages,
                });

                onUpdated?.();
                onClose();
                return;
            }

            if (!message.trim()) return;

            await contactApi.createContactWithEmail({
                customerCode,
                employeeCode,
                orderCode,
                orderDetailId: orderDetailId ? Number(orderDetailId) : undefined,
                contactType,
                name: customerName,
                phoneContact,
                email,
                message,
                isActive: true,
                image: finalImages.length > 0 ? finalImages : [],
            });

            onClose();
        } catch (err) {
            console.error("Submit failed:", err);
        } finally {
            setLoading(false);
        }
    };



    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {mode === "update-images"
                    ? t("actions.updateImages") ?? "Update images"
                    : t("actions.contactCustomer") ?? "Contact customer"}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={1} sx={{ mt: 1 }}>
                    {mode === "create" && (
                        <>
                            <TextField
                                label={t("labels.orderCode") ?? "Order"}
                                value={orderCode ?? ""}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />
                            {mode === "create" && (
                                <>
                                    {/* CONTACT TYPE */}
                                    <TextField
                                        select
                                        label={t("labels.contactType") ?? "Contact type"}
                                        value={contactType}
                                        onChange={(e) => setContactType(e.target.value)}
                                        fullWidth
                                        required
                                    >
                                        {CONTACT_TYPE_OPTIONS.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {t(opt.i18nKey)}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* ORDER DETAIL ID */}
                                    <TextField
                                        label={t("labels.orderDetailId") ?? "Order detail ID"}
                                        value={orderDetailId}
                                        onChange={(e) => setOrderDetailId(e.target.value)}
                                        type="number"
                                        fullWidth
                                        disabled={contactType !== "damage report"}
                                    />
                                </>
                            )}


                            <TextField
                                label={t("labels.name") ?? "Name"}
                                value={customerName ?? ""}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />

                            <TextField
                                label={t("labels.email") ?? "Email"}
                                value={email ?? ""}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />

                            <TextField
                                label={t("labels.phone") ?? "Phone"}
                                value={phoneContact ?? ""}
                                fullWidth
                                InputProps={{ readOnly: true }}
                            />


                            <TextField
                                label={t("labels.message") ?? "Message"}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                multiline
                                minRows={4}
                                fullWidth
                            />
                        </>
                    )}

                    {/* Upload */}
                    <Box>
                        <Typography variant="subtitle2">{t("labels.images") ?? "Images"}</Typography>
                        <input type="file" accept="image/*" multiple onChange={(e) => handleFilesSelected(e.target.files)} />

                        {previewImages.length > 0 && (
                            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                                {previewImages.map((u, i) => (
                                    <img key={i} src={u} style={{ width: 80, height: 80, objectFit: "cover" }} />
                                ))}
                            </Box>
                        )}

                        {selectedFiles?.length ? (
                            <Button sx={{ mt: 1 }} size="small" variant="outlined" onClick={handleUploadImages} disabled={imgUploading}>
                                {imgUploading ? <CircularProgress size={16} /> : t("actions.upload") ?? "Upload"}
                            </Button>
                        ) : null}
                    </Box>

                    {/* Uploaded */}
                    {images.length > 0 && (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {images.map((src, idx) => (
                                <Box key={idx} sx={{ width: 80, height: 80, position: "relative" }}>
                                    <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <IconButton
                                        size="small"
                                        sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(0,0,0,0.5)", color: "#fff" }}
                                        onClick={() => window.open(src, "_blank")}
                                    >
                                        <OpenInFullIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>{t("actions.cancel") ?? "Cancel"}</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? <CircularProgress size={18} /> : t("actions.confirm") ?? "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
