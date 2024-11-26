import Button from "@mui/material/Button";
import { useSession } from "@/lib";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

export default function GitHubLoginButton() {
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const s = useSession().state;
  const u = s.detail?.user;

  return (
    <div>
      {s.has() ? (
        <>
          <IconButton onClick={handleOpenUserMenu}>
            <Typography sx={{ color: "#c0c0c0", mr: 2 }}>{u.displayName}</Typography>
            <Avatar alt={u.displayName} src={u.avatarUrl} />
          </IconButton>
          <Menu sx={{ mt: '45px' }} id="menu-appbar" anchorEl={anchorElUser} keepMounted
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElUser)} onClose={handleCloseUserMenu}
          >
            <MenuItem key="signOut" onClick={s.clear}>
              <Typography sx={{ textAlign: 'center' }}>Sign out</Typography>
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant="contained"
          onClick={s.redirect}
        >
          Sign in with GitHub
        </Button>
      )}
    </div>
  );
}
