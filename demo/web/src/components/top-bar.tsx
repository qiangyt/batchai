"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import GitHubLoginButton from "./github-login.button";
import Container from "@mui/material/Container";
import GitHubIcon from "@mui/icons-material/GitHub";
import MuiLink from "@mui/material/Link";
// import Breadcrumbs from "@mui/material/Breadcrumbs";
// import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NextLink from "next/link";
import HomeIcon from '@mui/icons-material/HomeOutlined';
// import { usePathname } from "next/navigation";
// import { useEffect, useState } from "react";

interface Props {
    anchorId: string;
}

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function TopBar({ anchorId }: Props) {
    // const pathname = usePathname();
    // const [segments, setSegments] = useState([]);

    // useEffect(() => {
    //     const paths = pathname.split('/').filter(Boolean);
    //     setSegments(paths);
    // }, [pathname]);

    // const breadcrumb = (<Breadcrumbs hidden sx={{ mt: 2, mb: 2, ml: 4.8 }} color="lightgray" separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
    //     <NextLink key="1" href={{ pathname: `/` }}><HomeIcon /></NextLink>
    //     {
    //         segments.map((segment, index) => {
    //             const path = `/${segments.slice(0, index + 1).join('/')}`;
    //             const isLast = (index === segments.length - 1);
    //             if (isLast) {
    //                 return <Typography key={path}>{segment}</Typography>;
    //             }
    //             return <NextLink key={path} href={{ pathname: `/commands/10` }}>{segment}</NextLink>;
    //         })}
    //     </Breadcrumbs>);

    return <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{ backgroundColor: "black" }}>
            <Container maxWidth="xl" >
                <Toolbar id={anchorId} disableGutters>
                    <MuiLink href="https://github.com/qiangyt/batchai">
                        <GitHubIcon sx={{ mr: 2, color: 'white' }} />
                    </MuiLink>
                    <Typography variant="h6" component="a" href="/" sx={{ flexGrow: 1 }} noWrap>
                        BatchAI Examples
                        <Box>
                            <Typography sx={{ fontSize: 10, color: "lightgray" }} noWrap>
                                Utilizes AI for batch processing of the entire codebase
                            </Typography>
                        </Box>
                    </Typography>

                    <NextLink href={{ pathname: `/` }}><HomeIcon sx={{ mr: 6 }} /></NextLink>
                    <GitHubLoginButton />
                </Toolbar>
            </Container>
        </AppBar>
        <Offset />
    </Box>


}