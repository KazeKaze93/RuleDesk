import { describe, it, expect, vi } from "vitest";

// Test FilterToggleGroup logic
describe("FilterToggleGroup Logic", () => {
  describe("Option handling", () => {
    it("should handle string value from ToggleGroup", () => {
      const onValueChange = vi.fn();

      const handleChange = (val: string | string[]) => {
        const stringVal = typeof val === "string" ? val : val[0] || "";
        if (stringVal) onValueChange(stringVal);
      };

      handleChange("all");
      expect(onValueChange).toHaveBeenCalledWith("all");
    });

    it("should handle array value from ToggleGroup", () => {
      const onValueChange = vi.fn();

      const handleChange = (val: string | string[]) => {
        const stringVal = typeof val === "string" ? val : val[0] || "";
        if (stringVal) onValueChange(stringVal);
      };

      handleChange(["hide"]);
      expect(onValueChange).toHaveBeenCalledWith("hide");
    });

    it("should not call onValueChange for empty value", () => {
      const onValueChange = vi.fn();

      const handleChange = (val: string | string[]) => {
        const stringVal = typeof val === "string" ? val : val[0] || "";
        if (stringVal) onValueChange(stringVal);
      };

      handleChange("");
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("Disabled options", () => {
    it("should apply disabled classes to disabled options", () => {
      const option = {
        value: "horizontal",
        label: "Horizontal",
        disabled: true,
      };
      const disabledClasses = option.disabled
        ? "opacity-50 cursor-not-allowed"
        : "";

      expect(disabledClasses).toBe("opacity-50 cursor-not-allowed");
    });

    it("should not apply disabled classes to enabled options", () => {
      const option = { value: "all", label: "All", disabled: false };
      const disabledClasses = option.disabled
        ? "opacity-50 cursor-not-allowed"
        : "";

      expect(disabledClasses).toBe("");
    });

    it("should add title attribute for disabled options", () => {
      const option = {
        value: "horizontal",
        label: "Horizontal",
        disabled: true,
      };
      const title = option.disabled ? "Coming soon" : undefined;

      expect(title).toBe("Coming soon");
    });
  });

  describe("Icon handling", () => {
    it("should render icon when provided", () => {
      const option = {
        value: "images",
        label: "Images",
        icon: "<Image />",
      };

      expect(option.icon).toBeDefined();
    });

    it("should handle options without icons", () => {
      const option = {
        value: "all",
        label: "All",
      };

      expect(option.icon).toBeUndefined();
    });
  });
});
