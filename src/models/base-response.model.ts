// src/types/BaseResponse.ts
import {Response} from 'express';

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface ServiceResponse<T> {
  message: string;
  data: T;
}

export const sendResponse = <T>(res: Response, statusCode: number, message: string, data: T) => {
  const response: ApiResponse<T> = {
    status: statusCode == 200,
    message: message,
    data: data,
  };
  return res.status(statusCode).json(response);
};

export const serviceResponseObj = <T>(message: string, data: T) => {
  return {
    message: message,
    data: data
  } as ServiceResponse<T>;
}
