'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { ChangeEvent, useState } from 'react';
import { otEvent } from '../lib/utils';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import {useTranslation} from '@/lib/i18n';

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

export class ConfirmDialogMessage {
    action?: string;
    subject?: string;
    subjectType?: string;

    constructor() { }
}

export class ConfirmDialogProps extends ConfirmDialogMessage {
    open: boolean;
    closeFunc?: () => void;
    onConfirmed?: () => void;

    constructor() { super(); }
}

export function ConfirmDialog(props: ConfirmDialogProps) {
    const { t, locale } = useTranslation();

    const [confirmInput, setConfirmInput] = useState('');
    const onChangeConfirmInput = (e: ChangeEvent<HTMLInputElement>) => {
        otEvent(e);
        setConfirmInput(e.target.value);
    };

    const onClose = (e) => {
        otEvent(e);
        setConfirmInput('');
        props.closeFunc();
    };

    const onConfirm = (e) => {
        otEvent(e);
        if (confirmInput === props.subject) {
            props.onConfirmed();
            setConfirmInput('');
            props.closeFunc();
        }
    };

    return (
        <Dialog open={props?.open} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
            <DialogTitle sx={{ backgroundColor: '#21232b', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
                {t("Confirm to action subjectType", {action: props?.action, subjectType: props?.subjectType})}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ m: 2 }}>
                    <Typography sx={{ textAlign: 'center', fontSize: 28 }}>
                        {props?.subject}
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        {t("Unexpected bad things will happen if you dont read this!")}
                    </Alert>
                    <Typography sx={{ mt: 2 }}>
                        {t("This will permanently action the subject subjectType and associated resources.", {action: props?.action, subject: props?.subject, subjectType: props?.subjectType})}
                    </Typography>
                    <Typography sx={{ mt: 4 }}>
                        { locale === 'en' ?
                        <>To confirm, type <span style={{ color: '#0085BF', fontStyle: 'italic' }}>{props?.subject}</span> in the box below:</>
                        :
                        <>请在下面输入<span style={{ color: '#0085BF', fontStyle: 'italic' }}>{props?.subject}</span>以确认确实要继续这么做：</>
                    }
                    </Typography>
                    <TextField autoFocus required margin="dense" label={props?.subjectType} fullWidth variant="standard" value={confirmInput} onChange={onChangeConfirmInput} />
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("Abort")}</Button>
                <Button onClick={onConfirm}>{t("Confirm")}</Button>
            </DialogActions>
        </Dialog>
    )
}