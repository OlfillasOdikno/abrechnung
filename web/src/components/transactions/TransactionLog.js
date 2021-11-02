import React, {useState} from "react";
import {useRecoilValue} from "recoil";
import {transactionsSeenByUser} from "../../recoil/transactions";
import ListItemLink from "../style/ListItemLink";
import TransactionCreateModal from "./TransactionCreateModal";
import {currUserPermissions, groupAccounts} from "../../recoil/groups";
import {DateTime} from "luxon";
import { Chip, Divider, Grid, IconButton, List, ListItemText, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
    propertyPill: {
        marginRight: "3px"
    }
}));

export default function TransactionLog({group}) {
    const classes = useStyles();
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const transactions = useRecoilValue(transactionsSeenByUser(group.id));
    const userPermissions = useRecoilValue(currUserPermissions(group.id));
    const accounts = useRecoilValue(groupAccounts(group.id));

    const accountNamesFromShares = (shares) => {
        return shares.map(s => accounts.find(a => a.id === parseInt(s))?.name).join(", ");
    }

    return (
        <div>
            {userPermissions.can_write && (
                <Grid container justifyContent="center">
                    <IconButton color="primary" onClick={() => setShowCreateDialog(true)}>
                        <Add/>
                    </IconButton>
                </Grid>
            )}
            <Divider variant="middle"/>
            <List>
                {transactions.length === 0 ? (
                    <div className="list-group-item" key={0}>No Transactions</div>
                ) : (
                    transactions.map(transaction => (
                        <ListItemLink key={transaction.id}
                                      to={`/groups/${group.id}/transactions/${transaction.id}`}>
                            <ListItemText primary={(
                                <>
                                    <Typography variant="body1">
                                        <Chip style={{marginRight: "5px"}} color="primary" variant="outlined"
                                              size="small" label={transaction.type}/>
                                        {transaction.is_wip && (
                                            <Chip color="secondary" variant="outlined" label="WIP" size="small"
                                                  className={classes.propertyPill}/>
                                        )}
                                        {transaction.description}
                                    </Typography>
                                </>
                            )}
                                          secondary={(
                                              <>
                                                  <span>{transaction.value.toFixed(2)} {transaction.currency_symbol} - </span>
                                                  <span>by {accountNamesFromShares(Object.keys(transaction.creditor_shares))}, </span>
                                                  <span>for {accountNamesFromShares(Object.keys(transaction.debitor_shares))}</span>
                                              </>
                                          )}/>
                            <ListItemText>
                                <Typography align="right" variant="body2">
                                    {DateTime.fromISO(transaction.billed_at).toLocaleString(DateTime.DATE_FULL)}
                                </Typography>
                            </ListItemText>
                        </ListItemLink>
                    ))
                )}
            </List>
            <TransactionCreateModal group={group} show={showCreateDialog}
                                    onClose={() => setShowCreateDialog(false)}/>
        </div>
    );
}
