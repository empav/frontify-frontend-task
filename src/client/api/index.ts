import {
    fetchResponseSchema,
    uploadChunkInputSchema,
    uploadSingleInputSchema,
    type FetchFilesResponse,
} from '../types';

export const fetchFiles = async (): Promise<FetchFilesResponse> => {
    const res = await fetch('/api/files');
    if (!res.ok) {
        throw new Error(`Failed to fetch files: ${res.status} ${res.statusText}`);
    }

    const data: unknown = await res.json();

    const parsed = fetchResponseSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Failed parsing');
    }

    return parsed.data;
};

export const uploadSingle = async (file: File): Promise<Response> => {
    const parsed = uploadSingleInputSchema.safeParse(file);
    if (!parsed.success) {
        throw new Error('Failed parsing');
    }

    const body = new FormData();
    body.append('file', file);
    return fetch('/api/upload-single', {
        method: 'POST',
        body,
    });
};

export const uploadChunk = async (body: FormData) => {
    const parsed = uploadChunkInputSchema.safeParse(body);
    if (!parsed.success) {
        throw new Error('Failed parsing');
    }
    return fetch('/api/upload-chunk', {
        method: 'POST',
        body,
    });
};
