import { Response } from "express";
import { AuthRequest } from "../../middlewares/verifyToken";
import {
  confirmCoursePayment,
  createCoursePayment,
  getAllPayments,
  getMyPayments,
  updatePaymentStatus,
} from "./payment.service";

const sendPaymentError = (res: Response, error: any) => {
  const message = error.message;

  if (message === "COURSE_NOT_FOUND" || message === "PAYMENT_NOT_FOUND") {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }

  if (message === "COURSE_NOT_APPROVED") {
    return res.status(400).json({ success: false, message: "Course is not approved" });
  }

  if (message === "COURSE_REQUIRED") {
    return res.status(400).json({ success: false, message: "Course ID is required" });
  }

  if (message === "INVALID_PROVIDER") {
    return res.status(400).json({ success: false, message: "Invalid payment provider" });
  }

  if (message === "ALREADY_ENROLLED") {
    return res.status(409).json({ success: false, message: "Already enrolled in this course" });
  }

  if (message === "PAYMENT_ALREADY_COMPLETED") {
    return res.status(409).json({ success: false, message: "Payment already completed" });
  }

  if (message === "TRANSACTION_REQUIRED") {
    return res.status(400).json({ success: false, message: "Transaction ID is required" });
  }

  if (message === "PAYMENT_NOT_PENDING") {
    return res.status(400).json({ success: false, message: "Payment is not pending" });
  }

  if (message === "INVALID_STATUS") {
    return res.status(400).json({ success: false, message: "Invalid payment status" });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
};

export const createPaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { courseId, provider, notes } = req.body;

    const result = await createCoursePayment({
      studentId,
      courseId,
      provider,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    return sendPaymentError(res, error);
  }
};

export const confirmPaymentController = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const { paymentId } = req.params;
    const { transactionId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: "Payment ID is required" });
    }

    const result = await confirmCoursePayment(paymentId, studentId, transactionId);

    return res.status(200).json({
      success: true,
      message: "Payment confirmed and enrollment completed",
      data: result,
    });
  } catch (error: any) {
    return sendPaymentError(res, error);
  }
};

export const getMyPaymentsController = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const payments = await getMyPayments(studentId);

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    return sendPaymentError(res, error);
  }
};

export const getAllPaymentsController = async (_req: AuthRequest, res: Response) => {
  try {
    const payments = await getAllPayments();

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    return sendPaymentError(res, error);
  }
};

export const updatePaymentStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: "Payment ID is required" });
    }

    const payment = await updatePaymentStatus(paymentId, status);

    return res.status(200).json({
      success: true,
      message: "Payment status updated",
      data: payment,
    });
  } catch (error: any) {
    return sendPaymentError(res, error);
  }
};
