import { KeyboardEvent, useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";

const MAX_TAGS = 5;
const MAX_TAG_LEN = 20;
const TAG_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;

type Props = {
  tags: string[];
  inputValue: string;
  error?: string | null;
  onTagsChange: (tags: string[]) => void;
  onInputChange: (value: string) => void;
  onError: (error: string | null) => void;
};

export function TagInputField({ tags, inputValue, error, onTagsChange, onInputChange, onError }: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  function addTag(raw: string) {
    const v = raw.trim().replace(/^#+/, "");
    if (!v) return;
    if (!TAG_ALLOWED.test(v)) {
      onError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
      return;
    }
    if (v.length > MAX_TAG_LEN) {
      onError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
      return;
    }
    if (tags.includes(v)) {
      onError("이미 추가된 태그입니다.");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      onError(`태그는 최대 ${MAX_TAGS}개까지 가능합니다.`);
      return;
    }
    onError(null);
    onTagsChange([...tags, v]);
    onInputChange("");
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    onTagsChange(tags.filter((_, i) => i !== index));
    onError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
      return;
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault();
      removeTag(tags.length - 1);
    }
  }

  const atMax = tags.length >= MAX_TAGS;
  const charCount = inputValue.length;
  const isOverLen = charCount > MAX_TAG_LEN;
  const normalized = inputValue.trim().replace(/^#+/, "");
  const isInvalidChars = Boolean(normalized && !TAG_ALLOWED.test(normalized));
  const isInvalidInput = isOverLen || isInvalidChars;

  const accentColor = isInvalidInput ? theme.palette.error.main : theme.palette.primary.main;
  const borderColor = error
    ? theme.palette.error.main
    : focused
    ? theme.palette.primary.main
    : "rgba(0,0,0,0.23)";
  const borderWidth = focused || Boolean(error) ? 2 : 1;

  return (
    <Box>
      <Box
        onClick={() => inputRef.current?.focus()}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.75,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          cursor: "text",
          minHeight: 48,
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      >
        {tags.map((tag, index) => (
          <Chip
            key={`${tag}-${index}`}
            label={`#${tag}`}
            size="small"
            variant="outlined"
            onDelete={() => removeTag(index)}
            deleteIcon={<CloseIcon sx={{ fontSize: "14px !important" }} />}
            sx={{ fontWeight: 600, height: 26 }}
          />
        ))}

        {!atMax && (
          <InputBase
            inputRef={inputRef}
            value={inputValue}
            onChange={(e) => {
              const v = e.target.value;
              onInputChange(v);
              const normalized = v.trim().replace(/^#+/, "");
              if (normalized && !TAG_ALLOWED.test(normalized)) {
                onError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
              } else if (v.length > MAX_TAG_LEN) {
                onError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
              } else {
                onError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={tags.length === 0 ? "예) 뉴스, 스포츠" : ""}
            sx={{ flex: 1, minWidth: 80, fontSize: 14, "& input": { p: 0 } }}
          />
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: "auto", flexShrink: 0 }}>
          {!atMax && inputValue.trim() && (
            <IconButton
              size="small"
              onMouseDown={(e) => { e.preventDefault(); addTag(inputValue); }}
              sx={{
                p: 0.25,
                color: accentColor,
                bgcolor: alpha(accentColor, 0.1),
                "&:hover": { bgcolor: alpha(accentColor, 0.2) },
              }}
              aria-label="태그 추가"
              tabIndex={-1}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: atMax ? 700 : 400,
              color: atMax ? "primary.main" : "text.disabled",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {tags.length}/{MAX_TAGS}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 0.5,
          px: 0.25,
        }}
      >
        <FormHelperText error={Boolean(error)} sx={{ m: 0 }}>
          {error ?? "Enter 또는 쉼표(,)로 태그를 추가해요."}
        </FormHelperText>
        {charCount > 0 && (
          <Typography
            variant="caption"
            sx={{ color: isOverLen ? "error.main" : "text.disabled", whiteSpace: "nowrap", ml: 1, flexShrink: 0 }}
          >
            {charCount}/{MAX_TAG_LEN}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
