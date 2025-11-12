import z from 'zod';

export type APIError = { error: string };

// Adjust this schema to match your actual FetchFilesResponse shape
export const fetchResponseSchema = z.object({
    files: z.array(
        z.object({
            name: z.string(),
            size: z.number(),
        })
    ),
});
export type FetchFilesResponse = z.infer<typeof fetchResponseSchema>;

export const uploadSingleInputSchema = z
    .instanceof(File)
    .refine((fd) => fd instanceof File, { message: 'Value must be an instance of File' });
export type UploadSingleInput = z.infer<typeof uploadSingleInputSchema>;

export const uploadChunkInputSchema = z
    .instanceof(FormData)
    .refine((fd) => fd instanceof FormData, { message: 'Value must be a FormData' })
    .refine(
        (fd) => {
            // required keys in your FormData
            const required = ['file', 'currentChunkIndex', 'totalChunks'];
            return required.every((k) => fd.has(k) && fd.get(k) !== null);
        },
        { message: 'FormData must include file, currentChunkIndex and totalChunks' }
    );

export type UploadChunkInput = z.infer<typeof uploadChunkInputSchema>;
