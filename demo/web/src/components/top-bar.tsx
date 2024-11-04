import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import GitHubLoginButton from "./github-login.button";
import Container from "@mui/material/Container";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Link } from "@mui/material";

interface Props {
    anchorId: string;
}

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function TopBar({ anchorId }: Props) {
    return <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed">
            <Container maxWidth="xl">
                <Toolbar id={anchorId} disableGutters>
                    <Link href="https://github.com/qiangyt/batchai">
                        <GitHubIcon sx={{mr:2, color: 'white'} }/>
                    </Link>
                    <Typography variant="h6" component="a" href="/" sx={{ flexGrow: 1 }} noWrap>
                        BatchAI Examples
                        <Box>
                        <Typography sx={{ fontSize: 10 }} noWrap>
                        Utilizes AI for batch processing of the entire codebase
                        </Typography> </Box>
                    </Typography>               
                    
                    <GitHubLoginButton />
                </Toolbar>
            </Container>
        </AppBar>
        <Offset />
    </Box>


}