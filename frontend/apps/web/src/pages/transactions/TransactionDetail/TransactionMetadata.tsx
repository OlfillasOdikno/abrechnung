import { AccountSelect } from "@/components/AccountSelect";
import { DateInput } from "@/components/DateInput";
import { NumericInput } from "@/components/NumericInput";
import { ShareSelect } from "@/components/ShareSelect";
import { TagSelector } from "@/components/TagSelector";
import { TextInput } from "@/components/TextInput";
import { selectTransactionSlice, useAppDispatch, useAppSelector } from "@/store";
import {
    selectTransactionBalanceEffect,
    selectTransactionById,
    selectTransactionHasFiles,
    selectTransactionHasPositions,
    wipTransactionUpdated,
} from "@abrechnung/redux";
import { Transaction, TransactionShare, TransactionValidator } from "@abrechnung/types";
import {
    Checkbox,
    FormControlLabel,
    Grid,
    InputAdornment,
    TableCell,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { fromISOString } from "@abrechnung/utils";
import * as React from "react";
import { typeToFlattenedError, z } from "zod";
import { FileGallery } from "./FileGallery";
import { useTranslation } from "react-i18next";
import { useFormatCurrency } from "@/hooks";
import { Frequency, RRule, rrulestr } from "rrule";
import { Group } from "@mui/icons-material";

interface Props {
    groupId: number;
    transactionId: number;
    validationErrors: typeToFlattenedError<z.infer<typeof TransactionValidator>>;
    showPositions?: boolean | undefined;
}

export const TransactionMetadata: React.FC<Props> = ({
    groupId,
    transactionId,
    validationErrors,
    showPositions = false,
}) => {
    const { t } = useTranslation();
    const formatCurrency = useFormatCurrency();
    const dispatch = useAppDispatch();
    const transaction = useAppSelector((state) =>
        selectTransactionById({ state: selectTransactionSlice(state), groupId, transactionId })
    );
    const hasAttachments = useAppSelector((state) =>
        selectTransactionHasFiles({ state: selectTransactionSlice(state), groupId, transactionId })
    );
    const hasPositions = useAppSelector((state) =>
        selectTransactionHasPositions({ state: selectTransactionSlice(state), groupId, transactionId })
    );
    const balanceEffect = useAppSelector((state) =>
        selectTransactionBalanceEffect({ state: selectTransactionSlice(state), groupId, transactionId })
    );

    const renderShareInfo = React.useCallback(
        ({ account }) =>
            showPositions || hasPositions ? (
                <>
                    <TableCell align="right">
                        {formatCurrency(balanceEffect[account.id]?.positions ?? 0, transaction.currency_symbol)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell align="right">
                        {formatCurrency(balanceEffect[account.id]?.commonDebitors ?? 0, transaction.currency_symbol)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell width="100px" align="right">
                        {formatCurrency(
                            (balanceEffect[account.id]?.commonDebitors ?? 0) +
                                (balanceEffect[account.id]?.positions ?? 0),
                            transaction.currency_symbol
                        )}
                    </TableCell>
                </>
            ) : (
                <TableCell width="100px" align="right">
                    {formatCurrency(
                        (balanceEffect[account.id]?.commonDebitors ?? 0) + (balanceEffect[account.id]?.positions ?? 0),
                        transaction.currency_symbol
                    )}
                </TableCell>
            ),
        [showPositions, hasPositions, transaction, balanceEffect, formatCurrency]
    );

    const shouldDisplayAccount = React.useCallback(
        (accountId: number) =>
            balanceEffect[accountId] !== undefined &&
            (balanceEffect[accountId].commonDebitors !== 0 || balanceEffect[accountId].positions !== 0),
        [balanceEffect]
    );

    const pushChanges = React.useCallback(
        (
            newValue: Partial<
                Pick<
                    Transaction,
                    | "name"
                    | "description"
                    | "billed_at"
                    | "repeat"
                    | "value"
                    | "creditor_shares"
                    | "debitor_shares"
                    | "tags"
                >
            >
        ) => {
            if (!transaction.is_wip) {
                return;
            }
            dispatch(wipTransactionUpdated({ ...transaction, ...newValue }));
        },
        [dispatch, transaction]
    );

    const updatedebitor_shares = React.useCallback(
        (shares: TransactionShare) => pushChanges({ debitor_shares: shares }),
        [pushChanges]
    );

    const [repeatRule, setRepeatRule] = React.useState<RRule>();
    const [repeatRuleUntil, setRepeatRuleUntil] = React.useState<string>("");
    const [showRepeated, setShowRepeatedState] = React.useState<boolean>(false);
    const [showRepeatedAdvanced, setShowRepeatedAdvanced] = React.useState<boolean>(false);

    const setShowRepeated = React.useCallback(
        (value: boolean) => {
            setShowRepeatedState(value);
            if (!value) {
                pushChanges({ repeat: "" });
            }
        },
        [pushChanges]
    );

    React.useEffect(() => {
        if (transaction.repeat && transaction.repeat !== "") {
            try {
                setRepeatRule(rrulestr(transaction.repeat, {}));
            } catch (error) {
                console.error(error);
            }
        } else {
            setRepeatRule(null);
        }
    }, [transaction.repeat]);

    React.useEffect(() => {
        if (repeatRule && transaction.repeat !== "") {
            if (repeatRule.options.until) {
                setRepeatRuleUntil(repeatRule.options.until.toISOString());
            } else {
                setRepeatRuleUntil("");
            }
            setShowRepeated(true);
        } else {
            setRepeatRuleUntil("");
        }
    }, [repeatRule, setShowRepeated, transaction.repeat]);

    const setRepeatUntil = (value: string) => {
        try {
            const rule = rrulestr(transaction.repeat, {});
            try {
                rule.origOptions.until = fromISOString(value);
            } catch (error) {
                console.error(error);
            }
            pushChanges({ repeat: rule.toString() });
        } catch (error) {
            pushChanges({
                repeat: new RRule({
                    until: fromISOString(value),
                }).toString(),
            });
        }
    };

    const handleSetFrequency = (event: React.MouseEvent<HTMLElement>, value: Frequency) => {
        try {
            const rule = rrulestr(transaction.repeat, {});
            rule.origOptions.freq = value;
            pushChanges({ repeat: rule.toString() });
        } catch (error) {
            pushChanges({
                repeat: new RRule({
                    freq: value,
                }).toString(),
            });
        }
    };

    return (
        <Grid container>
            <Grid item xs={transaction.is_wip || hasAttachments ? 6 : 12}>
                <TextInput
                    label={t("common.name")}
                    name="name"
                    variant="standard"
                    margin="dense"
                    autoFocus
                    fullWidth
                    error={!!validationErrors.fieldErrors.name}
                    helperText={validationErrors.fieldErrors.name}
                    onChange={(value) => pushChanges({ name: value })}
                    value={transaction.name}
                    disabled={!transaction.is_wip}
                />
                {!transaction.is_wip && transaction.description === "" ? null : (
                    <TextInput
                        label={t("common.description")}
                        name="description"
                        variant="standard"
                        margin="dense"
                        fullWidth
                        error={!!validationErrors.fieldErrors.description}
                        helperText={validationErrors.fieldErrors.description}
                        onChange={(value) => pushChanges({ description: value })}
                        value={transaction.description}
                        disabled={!transaction.is_wip}
                    />
                )}
                <NumericInput
                    label={t("common.value")}
                    name="value"
                    variant="standard"
                    margin="dense"
                    fullWidth
                    error={!!validationErrors.fieldErrors.value}
                    helperText={validationErrors.fieldErrors.value}
                    onChange={(value) => pushChanges({ value })}
                    value={transaction.value}
                    disabled={!transaction.is_wip}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">{transaction.currency_symbol}</InputAdornment>,
                    }}
                />
                <DateInput
                    label={showRepeated ? t("common.startDate") : t("common.date")}
                    value={transaction.billed_at || ""}
                    onChange={(value) => pushChanges({ billed_at: value })}
                    error={!!validationErrors.fieldErrors.billed_at}
                    helperText={validationErrors.fieldErrors.billed_at}
                    disabled={!transaction.is_wip}
                />

                <FormControlLabel
                    control={<Checkbox name={"show-repeated"} />}
                    checked={showRepeated}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setShowRepeated(event.target.checked)}
                    label="Repeated"
                    disabled={!transaction.is_wip}
                />
                {showRepeated ? (
                    <>
                        <ToggleButtonGroup
                            value={repeatRule ? repeatRule.origOptions.freq : undefined}
                            exclusive
                            onChange={handleSetFrequency}
                            aria-label="repeat frequency"
                            size="small"
                            disabled={!transaction.is_wip}
                        >
                            <ToggleButton value={Frequency.DAILY} aria-label="daily">
                                {t("frequency.daily")}
                            </ToggleButton>
                            <ToggleButton value={Frequency.WEEKLY} aria-label="weekly">
                                {t("frequency.weekly")}
                            </ToggleButton>
                            <ToggleButton value={Frequency.MONTHLY} aria-label="monthly">
                                {t("frequency.monthly")}
                            </ToggleButton>
                            <ToggleButton value={Frequency.YEARLY} aria-label="yearly">
                                {t("frequency.yearly")}
                            </ToggleButton>
                        </ToggleButtonGroup>
                        <DateInput
                            label={t("common.endDate")}
                            value={repeatRuleUntil}
                            onChange={(value) => setRepeatUntil(value)}
                            error={!!validationErrors.fieldErrors.repeat}
                            helperText={validationErrors.fieldErrors.repeat}
                            disabled={!transaction.is_wip}
                        />
                        <FormControlLabel
                            control={<Checkbox name={"show-repeated-advanced"} />}
                            checked={showRepeatedAdvanced}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                setShowRepeatedAdvanced(event.target.checked)
                            }
                            label={t("common.advanced")}
                            disabled={!transaction.is_wip}
                        />
                        {showRepeatedAdvanced ? (
                            <TextInput
                                label="Repeat (rfc5545)"
                                name="repeat"
                                variant="standard"
                                margin="dense"
                                autoFocus
                                fullWidth
                                error={!!validationErrors.fieldErrors.repeat}
                                helperText={validationErrors.fieldErrors.repeat}
                                onChange={(value) => pushChanges({ repeat: value })}
                                value={transaction.repeat}
                                disabled={!transaction.is_wip}
                            />
                        ) : undefined}
                    </>
                ) : undefined}

                {!transaction.is_wip && transaction.tags.length === 0 ? null : (
                    <TagSelector
                        margin="dense"
                        fullWidth
                        label={t("common.tag", "", { count: 2 })}
                        groupId={groupId}
                        value={transaction.tags || []}
                        editable={transaction.is_wip}
                        onChange={(newValue) => pushChanges({ tags: newValue })}
                    />
                )}

                <AccountSelect
                    margin="normal"
                    groupId={groupId}
                    label={
                        transaction.type === "transfer" ? t("transactions.transferredFrom") : t("transactions.paidBy")
                    }
                    value={
                        Object.keys(transaction.creditor_shares).length === 0
                            ? null
                            : Number(Object.keys(transaction.creditor_shares)[0])
                    }
                    onChange={(newValue) => pushChanges({ creditor_shares: { [newValue.id]: 1.0 } })}
                    noDisabledStyling={true}
                    disabled={!transaction.is_wip}
                    error={!!validationErrors.fieldErrors.creditor_shares}
                    helperText={validationErrors.fieldErrors.creditor_shares}
                />

                {transaction.type === "transfer" && (
                    <AccountSelect
                        margin="normal"
                        groupId={groupId}
                        label={t("transactions.transferredTo")}
                        value={
                            Object.keys(transaction.debitor_shares).length === 0
                                ? null
                                : Number(Object.keys(transaction.debitor_shares)[0])
                        }
                        onChange={(newValue) => pushChanges({ debitor_shares: { [newValue.id]: 1.0 } })}
                        noDisabledStyling={true}
                        disabled={!transaction.is_wip}
                        error={!!validationErrors.fieldErrors.debitor_shares}
                        helperText={validationErrors.fieldErrors.debitor_shares}
                    />
                )}
            </Grid>

            {(transaction.is_wip || hasAttachments) && (
                <Grid item xs={6}>
                    <FileGallery groupId={groupId} transactionId={transactionId} />
                </Grid>
            )}
            {transaction.type === "purchase" && (
                <Grid item xs={12}>
                    <ShareSelect
                        groupId={groupId}
                        label={t("transactions.paidFor")}
                        value={transaction.debitor_shares}
                        error={!!validationErrors.fieldErrors.debitor_shares}
                        helperText={validationErrors.fieldErrors.debitor_shares}
                        onChange={updatedebitor_shares}
                        shouldDisplayAccount={shouldDisplayAccount}
                        additionalShareInfoHeader={
                            showPositions || hasPositions ? (
                                <>
                                    <TableCell width="100px" align="right">
                                        {t("transactions.positions.positions")}
                                    </TableCell>
                                    <TableCell width="3px" align="center">
                                        +
                                    </TableCell>
                                    <TableCell width="100px" align="right">
                                        {t("transactions.positions.sharedPlusRest")}
                                    </TableCell>
                                    <TableCell width="3px" align="center">
                                        =
                                    </TableCell>
                                    <TableCell width="100px" align="right">
                                        {t("common.total")}
                                    </TableCell>
                                </>
                            ) : (
                                <TableCell width="100px" align="right">
                                    {t("common.shared")}
                                </TableCell>
                            )
                        }
                        renderAdditionalShareInfo={renderShareInfo}
                        editable={transaction.is_wip}
                    />
                </Grid>
            )}
        </Grid>
    );
};
