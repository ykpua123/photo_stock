import React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const CustomPagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const handleChange = (event: React.ChangeEvent<unknown>, page: number) => {
        onPageChange(page);
    };

    return (
        <Stack spacing={2} direction="row" justifyContent="center" alignItems="center" className="mt-4">
            <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handleChange}
                shape="rounded"
                color="primary"
                showFirstButton
                showLastButton
                sx={{
                    '& .MuiPaginationItem-root': {
                        color: 'white', // Font color
                        fontFamily: 'monospace', // Custom font family
                        '&.Mui-selected': {
                            color: '#1976d2', // Color for selected page
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                        },
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.08)', // Hover effect
                        },
                    },
                }}
            />
        </Stack>
    );
};

export default CustomPagination;
