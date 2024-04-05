import { DatePicker } from "@mui/x-date-pickers";
import { DateTime } from "luxon";
import * as React from "react";
import { DisabledTextField } from "./style/DisabledTextField";
import { useTranslation } from "react-i18next";

interface Props {
    value: string;
    onChange: (newValue: string) => void;
    disabled: boolean;
    helperText?: React.ReactNode;
    error?: boolean;
    label?: React.ReactNode;
}

export const DateInput: React.FC<Props> = ({ value, onChange, helperText, error, label, disabled = false }) => {
    const { t } = useTranslation();
    const handleChange = (value: DateTime) => {
        if (value.toISODate()) {
            onChange(value.toISODate());
        }
    };
    if (label === undefined) {
        label = t("common.date");
    }

    if (disabled) {
        return (
            <DisabledTextField
                label={label}
                variant="standard"
                margin="dense"
                fullWidth
                value={DateTime.fromISO(value).toISODate()}
                disabled={true}
            />
        );
    }

    return (
        <DatePicker
            label={label}
            format="yyyy-MM-dd"
            value={DateTime.fromISO(value)}
            onChange={handleChange}
            slotProps={{
                textField: {
                    variant: "standard",
                    margin: "normal",
                    fullWidth: true,
                    helperText,
                    error,
                },
            }}
        />
    );
};
