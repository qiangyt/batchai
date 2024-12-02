'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { otEvent } from '../lib/utils';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useTranslation } from '@/lib/i18n';

function PaperComponent(props: PaperProps) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}
        >
            <Paper {...props} />
        </Draggable>
    );
}

export class RequestStarDialogProps {
    open: boolean;
    closeFunc?: () => void;

    constructor() { }
}

export function RequestStarDialog(props: RequestStarDialogProps) {
    const { t } = useTranslation();
    
    const onClose = (e) => {
        otEvent(e);
        props.closeFunc();
    };

    const onConfirm = (e) => {
        otEvent(e);
        window.location.href = `https://github.com/qiangyt/batchai`;
        props.closeFunc();
    };

    return (
        <Dialog open={props?.open} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
            <DialogTitle sx={{ backgroundColor: '#21232b', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
                {t("Processing Usage Reached")}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ m: 2 }}>
                    <Typography sx={{ textAlign: 'center', fontSize: 28 }}>
                        {t("Thank you for using batchai!")}
                    </Typography>
                    <Alert severity="info" sx={{ mt: 1 }}>
                        {t("If you like this project, I’d greatly appreciate it if you could give me a star ⭐️ on GitHub!")}
                        <Box sx={{ mt: 2 }} />
                        {t("By starring me, you’ll unlock unlimited usage.")}
                    </Alert>
                    <Typography sx={{ mt: 2, ml: 3 }}>
                        {t("👉 Would you like to support me by giving a star?")}
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 1, }}>
                        {t("NOTE")}: <span style={{ color: 'red' }}>{t("RE-LOGIN after starred!")}</span>
                    </Alert>
                    <Typography sx={{ mt: 2, ml: 6 }}>
                        {t("Still have issue?")} {" -> "}
                        <Link href="https://github.com/qiangyt/batchai/issues">https://github.com/qiangyt/batchai/issues</Link>
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("Maybe Later")}</Button>
                <Button onClick={onConfirm}>{t("Star on GitHub now")}</Button>
            </DialogActions>
        </Dialog>
    )
}