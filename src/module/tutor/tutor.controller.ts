import { Request, Response } from "express";
import { getAllTutors, getTutorById } from "./tutor.service";

export const getTutors = async (req: Request, res: Response) => {
  try {
    const { search, category, minPrice, maxPrice, page, limit } = req.query;

    const filters: {
      search?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      limit?: number;
    } = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    };

    if (search) filters.search = search as string;
    if (category) filters.category = category as string;
    if (minPrice) filters.minPrice = parseFloat(minPrice as string);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

    const result = await getAllTutors(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getTutorByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Tutor ID is required",
      });
    }

    const tutor = await getTutorById(id as string);

    res.status(200).json({
      success: true,
      data: tutor,
    });
  } catch (error: any) {
    if (error.message === "TUTOR_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
