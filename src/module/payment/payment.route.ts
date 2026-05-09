import { Router } from "express";
import { verifyToken } from "../../middlewares/verifyToken";
import { verifyAdmin, verifyStudent } from "../../middlewares/role";
import {
  confirmPaymentController,
  createPaymentController,
  getAllPaymentsController,
  getMyPaymentsController,
  updatePaymentStatusController,
} from "./payment.controller";

const router = Router();

router.post("/payments", verifyToken, verifyStudent, createPaymentController);
router.patch(
  "/payments/:paymentId/confirm",
  verifyToken,
  verifyStudent,
  confirmPaymentController
);
router.get("/payments/my", verifyToken, verifyStudent, getMyPaymentsController);
router.get("/admin/payments", verifyToken, verifyAdmin, getAllPaymentsController);
router.patch(
  "/admin/payments/:paymentId/status",
  verifyToken,
  verifyAdmin,
  updatePaymentStatusController
);

export default router;
