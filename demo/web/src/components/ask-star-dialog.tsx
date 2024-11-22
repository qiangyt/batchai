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
import Container from '@mui/material/Container';

/*
标题：文件处理数量限制 🎉
正文：

感谢您使用batchai！普通用户只允许为每个代码库指定处理5个文件。

如果您喜欢这个项目，欢迎为我们在 GitHub 上点赞 ⭐️！
点赞后，您将享受不限数量的使用权限，帮助我们更好地改进项目并支持更多开发者！

👉 愿意为我们点赞支持吗？

按钮：

    立即去Github点赞
    以后再说

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

    constructor() {}
}

export function AskStarDialog(props: AskStarDialogProps) {
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
            Limited File Processing Usage
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ m: 2}}>
                    <Typography sx={{ textAlign: 'center', fontSize: 28 }}>
                    Thank you for using our batchai!
                    </Typography>
                    <Alert severity="info" sx={{ mt: 1}}>
                    If you like this project, we’d greatly appreciate it if you could give it a star ⭐️ on GitHub!
                    <Box sx={{mt: 2}}/>
                    By starring the project, you’ll unlock unlimited usage and help us improve the project for the entire developer community.
                    </Alert>
                    <Typography sx={{ mt: 2, ml: 3}}>
                    👉 Would you like to support us by giving a star?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 1, }}>
                    You need to <span style={{ color: 'red' }}>RE-LOGIN</span> after starred!
                    </Alert>
                    <Typography sx={{ mt: 2, ml: 6}}>
                        Still have issue? {" -> "} 
                        <Link href="https://github.com/qiangyt/batchai/issues">https://github.com/qiangyt/batchai/issues</Link>
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Maybe Later</Button>
                <Button onClick={onConfirm}>Star on GitHub now</Button>
            </DialogActions>
        </Dialog>
    )
}