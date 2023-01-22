import { Paper } from "@mui/material";
import { unstable_styleFunctionSx as sx, styled } from "@mui/system";

export const MobilePaper = styled(Paper)(({ theme }) =>
    sx({
        padding: { xs: 1, lg: 2 },
        boxShadow: { xs: 0, lg: 1 },
    })
) as typeof Paper;
