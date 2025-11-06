import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { forwardRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ChunkedUploader from './ChunkedUploader';

// Mock FileList component (optional if not testing it directly)
vi.mock('./FileList', () => ({
    __esModule: true,
    // eslint-disable-next-line react/display-name
    default: forwardRef(() => <div data-testid="file-list" />),
}));

// Mock fetchFiles import
vi.mock('./api', () => ({
    fetchFiles: vi.fn(),
}));

describe('ChunkedUploader component', () => {
    const mockUploadsChunks = vi.fn();
    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should match snapshot', () => {
        const { asFragment } = render(<ChunkedUploader uploadChunk={mockUploadsChunks} />);
        expect(asFragment()).toMatchSnapshot();
    });

    test('renders ChunkedUploader form', () => {
        render(<ChunkedUploader uploadChunk={mockUploadsChunks} />);
        expect(screen.getByText(/upload a file in chunks/i)).toBeInTheDocument();
        expect(screen.getByText(/% completed/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
    });

    test('calls uploadChunks when submitting', async () => {
        render(<ChunkedUploader uploadChunk={mockUploadsChunks} />);
        const fileInput = screen.getByTestId('file-input');

        const file = new File(['test'], 'test.txt');
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: /upload/i });

        await userEvent.click(uploadButton);

        expect(mockUploadsChunks).toHaveBeenCalledTimes(1);
    });

    test('clears file list after successful upload', async () => {
        mockUploadsChunks.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: true });

        render(<ChunkedUploader uploadChunk={mockUploadsChunks} />);
        const fileInput = screen.getByTestId('file-input');

        const file = [new File(['a'], 'a.txt')];
        await userEvent.upload(fileInput, file);

        const uploadButton = screen.getByRole('button', { name: /upload/i });
        await userEvent.click(uploadButton);

        await waitFor(() => expect(screen.queryByText('📄 a.txt')).not.toBeInTheDocument());
    });

    test('calls uploadChunks API on FileList after upload when withFileList=true', async () => {
        // Mock ref to FileList
        const mockRef = { current: { refetch: mockRefetch } };
        vi.spyOn(React, 'useRef').mockReturnValueOnce(mockRef).mockReturnValueOnce({ current: null });

        mockUploadsChunks.mockResolvedValue({ ok: true });

        render(<ChunkedUploader uploadChunk={mockUploadsChunks} withFileList />);
        const fileInput = screen.getByTestId('file-input');

        const file = new File(['hello'], 'hello.txt');
        await userEvent.upload(fileInput, file);

        await userEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(mockUploadsChunks).toHaveBeenCalledOnce());

        expect(screen.getByText('100% completed')).toBeInTheDocument();
    });

    test('disables upload button when no files selected', () => {
        render(<ChunkedUploader uploadChunk={mockUploadsChunks} />);
        const uploadButton = screen.getByRole('button', { name: /upload/i });
        expect(uploadButton).toBeDisabled();
    });
});
