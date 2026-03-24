export interface ApiError {
    code: string;
    message: string;
    field?: string;
}

export interface PostgresLikeError {
    code?: string;
    detail?: string;
    constraint?: string;
}

export interface ErrorWithDriver {
    message?: string;
    code?: string;
    field?: string;
    detail?: string;
    constraint?: string;
    driverError?: PostgresLikeError;
}
