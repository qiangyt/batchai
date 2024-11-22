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
import { Link } from '@mui/material';

/*
标题：使用数量已达上限 🎉
正文：

感谢您使用我们的开源项目！当前功能对普通用户的免费使用数量限制为 5。

如果您喜欢这个项目，欢迎为我们在 GitHub 上点赞 ⭐️！
点赞后，您将享受不限数量的使用权限，帮助我们更好地改进项目并支持更多开发者！

👉 愿意为我们点赞支持吗？

按钮：

    立即点赞（点击跳转到项目的 GitHub 页面）
    以后再说（关闭对话框）


Title: Usage Limit Reached 🎉
Body:

Thank you for using our open-source project! The current feature is limited to 5 uses for free users.

If you like this project, we’d greatly appreciate it if you could give it a star ⭐️ on GitHub!
By starring the project, you’ll unlock unlimited usage and help us improve the project for the entire developer community.

👉 Would you like to support us by giving a star?

Buttons:

    Star on GitHub (redirects to the project’s GitHub page)
    Maybe Later (closes the dialog)
*/

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

export class AskStarDialogProps {
    open: boolean;
    closeFunc?: () => void;    
    onConfirmed?: () => void;

    constructor() {}
}

export function AskStarDialog(props: AskStarDialogProps) {
    const onClose = (e) => {
        otEvent(e);
        props.closeFunc();
    };

    const onConfirm = (e) => {
        otEvent(e);
        // if (confirmInput === props.subject) {
        //     props.onConfirmed();            
        //     setConfirmInput('');
        //     props.closeFunc();
        // }
    };

    return (
        <Dialog open={props?.open} onClose={onClose} PaperComponent={PaperComponent} aria-labelledby="draggable-dialog-title">
            <DialogTitle sx={{ backgroundColor: '#0085BF', color: 'white', cursor: 'move' }} id="draggable-dialog-title">
                Usage Limit Reached
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ m: 2}}>
                    <Typography sx={{ textAlign: 'center', fontSize: 28 }}>
                        Thank you for using our open-source project! The current feature is limited to 5 uses for free users.
                    </Typography>
                    <Alert severity="warning">
                        If you like this project, we’d greatly appreciate it if you could give it a star ⭐️ on GitHub!
                        By starring the project, you’ll unlock unlimited usage and help us improve the project for the entire developer community.
                    </Alert>
                    <Typography sx={{ mt: 2}}>
                        👉 Would you like to support us by giving a star?
                    </Typography>
                    <Typography sx={{ mt: 2}}>
                        Have issue? 
                        <Link href="https://github.com/qiangyt/batchai/issues">https://github.com/qiangyt/batchai/issues</Link>
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Maybe Later</Button>
                <Button onClick={onConfirm}>Star on GitHub</Button>
            </DialogActions>
        </Dialog>
    )
}