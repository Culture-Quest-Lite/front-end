import { apiFetch } from "@/lib/api";

export interface RouteRespone  {

}

export interface RoutePayload {
    routeName: string;
    description: string;
    difficulty: string;
    estimateTime: number;
    totalDistance: number;

}