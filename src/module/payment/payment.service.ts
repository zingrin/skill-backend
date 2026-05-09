import { prisma } from "../../lib/prisma";

type PaymentProvider = "MANUAL" | "BKASH" | "NAGAD" | "ROCKET" | "CARD";
type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

interface CreatePaymentPayload {
  studentId: string;
  courseId: string;
  provider?: PaymentProvider;
  notes?: string;
}

const createMockCheckoutUrl = (paymentId: string) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/payments/${paymentId}`;
};

export const createCoursePayment = async ({
  studentId,
  courseId,
  provider = "MANUAL",
  notes,
}: CreatePaymentPayload) => {
  const allowedProviders: PaymentProvider[] = [
    "MANUAL",
    "BKASH",
    "NAGAD",
    "ROCKET",
    "CARD",
  ];

  if (!courseId) {
    throw new Error("COURSE_REQUIRED");
  }

  if (!allowedProviders.includes(provider)) {
    throw new Error("INVALID_PROVIDER");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
    },
  });

  if (!course) {
    throw new Error("COURSE_NOT_FOUND");
  }

  if (course.status !== "APPROVED") {
    throw new Error("COURSE_NOT_APPROVED");
  }

  const alreadyEnrolled = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
  });

  if (alreadyEnrolled) {
    throw new Error("ALREADY_ENROLLED");
  }

  if (course.price <= 0) {
    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId },
    });

    return {
      payment: null,
      enrollment,
      message: "Free course enrolled successfully",
    };
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      studentId,
      courseId,
      status: { in: ["PENDING", "COMPLETED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment?.status === "COMPLETED") {
    throw new Error("PAYMENT_ALREADY_COMPLETED");
  }

  if (existingPayment?.status === "PENDING") {
    return {
      payment: existingPayment,
      enrollment: null,
      message: "Pending payment already exists",
    };
  }

  const payment = await prisma.payment.create({
    data: {
      studentId,
      courseId,
      amount: course.price,
      provider,
      notes: notes ?? null,
      checkoutUrl: createMockCheckoutUrl("pending"),
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });

  const checkoutUrl = createMockCheckoutUrl(payment.id);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { checkoutUrl },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });

  return {
    payment: updatedPayment,
    enrollment: null,
    message: "Payment created successfully",
  };
};

export const confirmCoursePayment = async (
  paymentId: string,
  studentId: string,
  transactionId: string
) => {
  if (!transactionId?.trim()) {
    throw new Error("TRANSACTION_REQUIRED");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      studentId,
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status === "COMPLETED") {
    throw new Error("PAYMENT_ALREADY_COMPLETED");
  }

  if (payment.status !== "PENDING") {
    throw new Error("PAYMENT_NOT_PENDING");
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        transactionId: transactionId.trim(),
        paidAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
      },
    });

    const enrollment = await tx.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId: payment.courseId,
        },
      },
      update: {},
      create: {
        studentId,
        courseId: payment.courseId,
      },
    });

    return { payment: updatedPayment, enrollment };
  });
};

export const getMyPayments = async (studentId: string) => {
  return prisma.payment.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
        },
      },
    },
  });
};

export const getAllPayments = async () => {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
    },
  });
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus
) => {
  const allowedStatuses: PaymentStatus[] = [
    "PENDING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paidAt: status === "COMPLETED" ? payment.paidAt || new Date() : null,
      },
    });

    if (status === "COMPLETED") {
      await tx.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: payment.studentId,
            courseId: payment.courseId,
          },
        },
        update: {},
        create: {
          studentId: payment.studentId,
          courseId: payment.courseId,
        },
      });
    }

    return updatedPayment;
  });
};
