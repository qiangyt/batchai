'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { otEvent } from '../lib/utils';
import Paper, { PaperProps } from '@mui/material/Paper';
import Draggable from 'react-draggable';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useSession } from '@/lib';
import Link from '@mui/material/Link';
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

export class SignInDialogMessage {
    action?: string;

    constructor() { }
}

export class SignInDialogProps extends SignInDialogMessage {
    open: boolean;
    closeFunc?: () => void;

    constructor() { super(); }
}

export function SignInDialog(props: SignInDialogProps) {
    const { t } = useTranslation();
    const s = useSession().state;

    const onClose = (e) => {
        otEvent(e);
        props.closeFunc();
    };

    const onGoToGithub = (e) => {
        otEvent(e);

        s.redirect();
        props.closeFunc();
    };

    return (
        <Dialog open={props?.open} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
            <DialogTitle sx={{ backgroundColor: '#21232b', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
                {t("Sign in with GitHub")}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ m: 2 }}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                        {t("To action, please sign in with GITHUB.COM first", {action: props.action})}
                    </Alert>
                    <Typography sx={{ mt: 2 }}>
                        {t("Clicks [GO AHEAD] button to redirect to")} <Link href="https://github.com">GITHUB.COM</Link> {t("sign in page.")}
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t("Abort")}</Button>
                <Button onClick={onGoToGithub}>{t("Go ahead")}</Button>
            </DialogActions>
        </Dialog>
    )
}