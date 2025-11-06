import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { forwardRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Uploader from './Uploader';

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

describe('Uploader component', () => {
    const mockUploadSingle = vi.fn();
    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders uploader form', () => {
        render(<Uploader uploadSingle={mockUploadSingle} />);
        expect(screen.getByText(/upload files/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /click or tab to select files/i })).toBeInTheDocument();
    });

    test('shows selected file names after choosing files', async () => {
        render(<Uploader uploadSingle={mockUploadSingle} />);
        const fileInput = screen.getByTestId('file-input');

        const file1 = new File(['hello'], 'test1.txt', { type: 'text/plain' });
        const file2 = new File(['world'], 'test2.txt', { type: 'text/plain' });

        await userEvent.upload(fileInput, [file1, file2]);

        expect(screen.getByText('📄 test1.txt')).toBeInTheDocument();
        expect(screen.getByText('📄 test2.txt')).toBeInTheDocument();
    });

    test('calls uploadSingle for each file when submitting', async () => {
        render(<Uploader uploadSingle={mockUploadSingle} />);
        const fileInput = screen.getByTestId('file-input');

        const files = [new File(['foo'], 'foo.txt'), new File(['bar'], 'bar.txt')];
        await userEvent.upload(fileInput, files);

        const uploadButton = screen.getByRole('button', { name: /upload/i });

        await userEvent.click(uploadButton);

        expect(mockUploadSingle).toHaveBeenCalledTimes(2);
        expect(mockUploadSingle).toHaveBeenNthCalledWith(1, files[0]);
        expect(mockUploadSingle).toHaveBeenNthCalledWith(2, files[1]);
    });

    test('clears file list after successful upload', async () => {
        mockUploadSingle.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({ ok: true });

        render(<Uploader uploadSingle={mockUploadSingle} />);
        const fileInput = screen.getByTestId('file-input');

        const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];
        await userEvent.upload(fileInput, files);

        const uploadButton = screen.getByRole('button', { name: /upload/i });
        await userEvent.click(uploadButton);

        await waitFor(() => expect(screen.queryByText('📄 a.txt')).not.toBeInTheDocument());
    });

    test('calls uploadSingle API on FileList after upload when withFileList=true', async () => {
        // Mock ref to FileList
        const mockRef = { current: { refetch: mockRefetch } };
        vi.spyOn(React, 'useRef').mockReturnValueOnce(mockRef).mockReturnValueOnce({ current: null });

        mockUploadSingle.mockResolvedValue({ ok: true });

        render(<Uploader uploadSingle={mockUploadSingle} withFileList />);
        const fileInput = screen.getByTestId('file-input');

        const file = new File(['hello'], 'hello.txt');
        await userEvent.upload(fileInput, file);

        await userEvent.click(screen.getByRole('button', { name: /upload/i }));

        await waitFor(() => expect(mockUploadSingle).toHaveBeenCalledOnce());
    });

    test('disables upload button when no files selected', () => {
        render(<Uploader uploadSingle={mockUploadSingle} />);
        const uploadButton = screen.getByRole('button', { name: /upload/i });
        expect(uploadButton).toBeDisabled();
    });
});
