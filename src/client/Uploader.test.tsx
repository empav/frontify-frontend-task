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
    const mockRefetch = vi.fn();
    const mockOnFail = vi.fn();
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Single/Multiple', () => {
        const mockUploadSingle = vi.fn();

        test('should match snapshot', () => {
            const { asFragment } = render(<Uploader upload={mockUploadSingle} />);
            expect(asFragment()).toMatchSnapshot();
        });

        test('renders uploader form', () => {
            render(<Uploader upload={mockUploadSingle} />);
            expect(screen.getByText(/upload files/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /click or tab to select files/i })).toBeInTheDocument();
        });

        test('shows selected file names after choosing files', async () => {
            render(<Uploader upload={mockUploadSingle} />);
            const fileInput = screen.getByTestId('file-input');

            const file1 = new File(['hello'], 'test1.txt', { type: 'text/plain' });
            const file2 = new File(['world'], 'test2.txt', { type: 'text/plain' });

            await userEvent.upload(fileInput, [file1, file2]);

            expect(screen.getByText('📄 test1.txt')).toBeInTheDocument();
            expect(screen.getByText('📄 test2.txt')).toBeInTheDocument();
        });

        test('calls uploadSingle for each file when submitting', async () => {
            render(<Uploader upload={mockUploadSingle} onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const files = [new File(['foo'], 'foo.txt'), new File(['bar'], 'bar.txt')];
            await userEvent.upload(fileInput, files);

            const uploadButton = screen.getByRole('button', { name: /upload/i });

            await userEvent.click(uploadButton);

            expect(mockUploadSingle).toHaveBeenCalledTimes(2);
            expect(mockUploadSingle).toHaveBeenNthCalledWith(1, files[0]);
            expect(mockUploadSingle).toHaveBeenNthCalledWith(2, files[1]);
            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('clears file list after successful upload', async () => {
            mockUploadSingle.mockResolvedValueOnce({ ok: true });

            render(<Uploader upload={mockUploadSingle} onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];
            await userEvent.upload(fileInput, files);

            const uploadButton = screen.getByRole('button', { name: /upload/i });
            await userEvent.click(uploadButton);

            await waitFor(() => expect(screen.queryByText('📄 a.txt')).not.toBeInTheDocument());

            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('show up an error when API fails and call onFail', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            mockUploadSingle.mockRejectedValue({ ok: false });

            render(<Uploader upload={mockUploadSingle} onFail={mockOnFail} />);
            const fileInput = screen.getByTestId('file-input');

            const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];
            await userEvent.upload(fileInput, files);

            const uploadButton = screen.getByRole('button', { name: /upload/i });
            await userEvent.click(uploadButton);

            await waitFor(() => expect(screen.queryByText('Something went wrong during upload')).toBeInTheDocument());

            expect(mockOnFail).toHaveBeenCalledWith('Something went wrong during upload');
        });

        test('calls uploadSingle API on FileList after upload when withFileList=true', async () => {
            // Mock ref to FileList
            const mockRef = { current: { refetch: mockRefetch } };
            vi.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

            mockUploadSingle.mockResolvedValue({ ok: true });

            render(<Uploader upload={mockUploadSingle} withFileList onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const file = new File(['hello'], 'hello.txt');
            await userEvent.upload(fileInput, file);

            await userEvent.click(screen.getByRole('button', { name: /upload/i }));

            await waitFor(() => expect(mockUploadSingle).toHaveBeenCalledOnce());

            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('disables upload button when no files selected', () => {
            render(<Uploader upload={mockUploadSingle} />);
            const uploadButton = screen.getByRole('button', { name: /upload/i });
            expect(uploadButton).toBeDisabled();
        });
    });
    describe('Chunked', () => {
        const mockUploadsChunks = vi.fn();

        test('should match snapshot', () => {
            const { asFragment } = render(<Uploader uploadChunk={mockUploadsChunks} />);
            expect(asFragment()).toMatchSnapshot();
        });

        test('renders ChunkedUploader form', () => {
            render(<Uploader uploadChunk={mockUploadsChunks} />);
            expect(screen.getByText(/upload a file in chunks/i)).toBeInTheDocument();
            expect(screen.getByText(/% completed/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
        });

        test('calls uploadChunks when submitting', async () => {
            mockUploadsChunks.mockResolvedValueOnce({ ok: true });
            render(<Uploader uploadChunk={mockUploadsChunks} onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const file = new File(['test'], 'test.txt');
            await userEvent.upload(fileInput, file);

            const uploadButton = screen.getByRole('button', { name: /upload/i });

            await userEvent.click(uploadButton);

            expect(mockUploadsChunks).toHaveBeenCalledTimes(1);

            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('clears file list after successful upload', async () => {
            mockUploadsChunks.mockResolvedValueOnce({ ok: true });

            render(<Uploader uploadChunk={mockUploadsChunks} onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const file = [new File(['a'], 'a.txt')];
            await userEvent.upload(fileInput, file);

            const uploadButton = screen.getByRole('button', { name: /upload/i });
            await userEvent.click(uploadButton);

            await waitFor(() => expect(screen.queryByText('📄 a.txt')).not.toBeInTheDocument());

            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('show up an error when API fails and call onFail', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            mockUploadsChunks.mockRejectedValue({ ok: false });

            render(<Uploader uploadChunk={mockUploadsChunks} onFail={mockOnFail} />);
            const fileInput = screen.getByTestId('file-input');

            const file = [new File(['a'], 'a.txt')];
            await userEvent.upload(fileInput, file);

            const uploadButton = screen.getByRole('button', { name: /upload/i });
            await userEvent.click(uploadButton);

            await waitFor(() => expect(screen.queryByText('Chunked upload failed')).toBeInTheDocument());

            expect(mockOnFail).toHaveBeenCalledWith('Chunked upload failed');
        });

        test('calls uploadChunks API on FileList after upload when withFileList=true', async () => {
            // Mock ref to FileList
            const mockRef = { current: { refetch: mockRefetch } };
            vi.spyOn(React, 'useRef').mockReturnValueOnce(mockRef);

            mockUploadsChunks.mockResolvedValue({ ok: true });

            render(<Uploader uploadChunk={mockUploadsChunks} withFileList onSuccess={mockOnSuccess} />);
            const fileInput = screen.getByTestId('file-input');

            const file = new File(['hello'], 'hello.txt');
            await userEvent.upload(fileInput, file);

            await userEvent.click(screen.getByRole('button', { name: /upload/i }));

            await waitFor(() => expect(mockUploadsChunks).toHaveBeenCalledOnce());

            expect(screen.getByText('100% completed')).toBeInTheDocument();

            expect(mockOnSuccess).toHaveBeenCalledOnce();
        });

        test('disables upload button when no files selected', () => {
            render(<Uploader uploadChunk={mockUploadsChunks} />);
            const uploadButton = screen.getByRole('button', { name: /upload/i });
            expect(uploadButton).toBeDisabled();
        });
    });
});
