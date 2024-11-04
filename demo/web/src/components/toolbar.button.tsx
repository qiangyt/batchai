import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useUIContext } from '@/lib/ui.context';
import React from 'react';

interface ToolbarIcon {
    enabled: boolean;
    children: React.ReactNode;
    label: string;
    onClick: () => void;
}

export default function ToolbarIcon({ enabled, children, label, onClick }: ToolbarIcon) {
    const ui = useUIContext();

    const asyncOnClick = async() => {
        try {
           onClick();
         } catch (error) {
           ui.setError(error);
         } finally {
             ui.setLoading(false);
         }
     }

     
    const onClick_ = (e) => {
       // e.preventDefault();
        //e.stopPropagation();
        asyncOnClick();
    }

    return (
    <Stack direction="column" alignItems="center" sx={{ mr: 5 }}>
        <Tooltip title={label} placement="bottom">
            <Button disabled={!enabled} onClick={onClick_}>
                {children}
            </Button>
        </Tooltip>
        <Typography variant="caption" color={enabled ? "dark" : "lightgray"}>{label}</Typography>
    </Stack>
    )
}