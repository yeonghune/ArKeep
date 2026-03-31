import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

const CATEGORY_MAX_LENGTH = 10;

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  options: string[];
  disabled?: boolean;
  error?: string | null;
  placeholder?: string;
  label?: string;
  sx?: SxProps<Theme>;
};

export function CategoryInputField({ value, onChange, options, disabled, error, placeholder, label, sx }: Props) {
  const charCount = (value ?? "").trim().length;
  const isOverLimit = charCount > CATEGORY_MAX_LENGTH;

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value ?? ""}
      onChange={(_, v) => onChange(typeof v === "string" ? v || null : null)}
      onInputChange={(_, v, reason) => {
        if (reason === "input") onChange(v || null);
      }}
      disabled={disabled}
      noOptionsText="직접 입력하여 새 카테고리를 만들 수 있습니다."
      ListboxProps={{ sx: { maxHeight: 220, overflowY: "auto" } }}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder ?? "선택 또는 새 이름 입력"}
          fullWidth
          error={Boolean(error)}
          helperText={error ?? "한글, 영어, 숫자, 띄어쓰기만 허용"}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {params.InputProps.endAdornment}
                {charCount > 0 && (
                  <InputAdornment position="end" sx={{ mr: -0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: isOverLimit ? "error.main" : "text.disabled",
                        fontWeight: isOverLimit ? 700 : 400,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {charCount}/{CATEGORY_MAX_LENGTH}
                    </Typography>
                  </InputAdornment>
                )}
              </>
            ),
          }}
          slotProps={{ htmlInput: { ...params.inputProps, maxLength: CATEGORY_MAX_LENGTH } }}
        />
      )}
    />
  );
}
