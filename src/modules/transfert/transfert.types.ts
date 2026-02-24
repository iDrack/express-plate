export interface FileMetaData {
    id: number;
    originalName: string;
    storedAs: string;
    size: number;
    mimeType: string;
    userId: number;
}

export interface FilePageMetaData {
    page: number;
    totalPages: number;
    limit: number;
    totalItems: number;
    totalFiles: number,
    prevPage: number | null;
    nextPage: number | null;
}
