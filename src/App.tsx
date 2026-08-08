import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Calendar,
  Settings,
  FileText,
  ChevronRight,
  X,
  Info,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES, PAYMENT_METHODS } from "./types";
import type { Trip, Expense, CategoryType, PaymentMethodType } from "./types";
import {
  getTrips,
  saveTrips,
  getExpenses,
  saveExpenses,
  exportData,
  importData,
  clearAllData,
} from "./storage";

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<"trip-list" | "trip-detail">(
    "trip-list",
  );
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Data States
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Modal States
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Calendar view states for Trip Modal Date Range picker
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form Fields - Trip
  const [tripTitle, setTripTitle] = useState("");
  const [tripBudget, setTripBudget] = useState<number | "">("");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");
  const [tripMemo, setTripMemo] = useState("");

  // Form Fields - Expense
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");
  const [expenseCategory, setExpenseCategory] = useState<CategoryType>("food");
  const [expenseDate, setExpenseDate] = useState("");
  const [expensePaymentMethod, setExpensePaymentMethod] =
    useState<PaymentMethodType>("cash");
  const [expenseMemo, setExpenseMemo] = useState("");

  // Dropdown States for Custom Select
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isPaymentMethodDropdownOpen, setIsPaymentMethodDropdownOpen] =
    useState(false);

  // Load Initial Data
  useEffect(() => {
    setTrips(getTrips());
    setExpenses(getExpenses());
  }, []);

  // Sync with Storage
  const updateTrips = (newTrips: Trip[]) => {
    setTrips(newTrips);
    saveTrips(newTrips);
  };

  const updateExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    saveExpenses(newExpenses);
  };

  // Get currently selected trip
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Expenses filtered for active trip
  const activeExpenses = useMemo(() => {
    if (!selectedTripId) return [];
    return expenses
      .filter((e) => e.tripId === selectedTripId)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [expenses, selectedTripId]);

  // Calculations for active trip
  const stats = useMemo(() => {
    const totalSpent = activeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = activeTrip ? activeTrip.budget : 0;
    const remaining = budget - totalSpent;
    const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0;

    // Category Breakdown
    const byCategory: Record<CategoryType, number> = {
      food: 0,
      transport: 0,
      lodging: 0,
      sightseeing: 0,
      shopping: 0,
      laundry: 0,
      other: 0,
    };
    activeExpenses.forEach((e) => {
      if (byCategory[e.category] !== undefined) {
        byCategory[e.category] += e.amount;
      }
    });

    // Payment Method Breakdown
    const byPaymentMethod: Record<PaymentMethodType, number> = {
      cash: 0,
      credit: 0,
      qr: 0,
      other: 0,
    };
    activeExpenses.forEach((e) => {
      if (byPaymentMethod[e.paymentMethod] !== undefined) {
        byPaymentMethod[e.paymentMethod] += e.amount;
      }
    });

    return {
      totalSpent,
      remaining,
      percentSpent,
      byCategory,
      byPaymentMethod,
    };
  }, [activeExpenses, activeTrip]);

  // Currency Formatter Helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Date Formatter Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ja-JP", {
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(date);
  };

  // Get all dates for the active trip (for the custom timeline input picker)
  const tripDates = useMemo(() => {
    if (!activeTrip) return [];
    const start = new Date(activeTrip.startDate);
    const end = new Date(activeTrip.endDate);
    const dates: string[] = [];

    let current = new Date(start);
    const limit = 31; // Limit to prevent infinite loops
    let count = 0;

    while (current <= end && count < limit) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
      count++;
    }

    // Keep active selected date visible even if it lies outside the range
    if (expenseDate && !dates.includes(expenseDate)) {
      dates.push(expenseDate);
      dates.sort((a, b) => a.localeCompare(b));
    }

    return dates;
  }, [activeTrip, expenseDate]);

  // Calendar rendering helper values for Trip Modal Date Range picker
  const daysInMonth = useMemo(
    () => new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    [calendarYear, calendarMonth],
  );
  const firstDayIndex = useMemo(
    () => new Date(calendarYear, calendarMonth, 1).getDay(),
    [calendarYear, calendarMonth],
  );
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Open Add/Edit Trip Modal
  const openTripModal = (trip: Trip | null = null) => {
    if (trip) {
      setEditingTrip(trip);
      setTripTitle(trip.title);
      setTripBudget(trip.budget);
      setTripStartDate(trip.startDate);
      setTripEndDate(trip.endDate);
      setTripMemo(trip.memo);

      const start = new Date(trip.startDate);
      if (!isNaN(start.getTime())) {
        setCalendarYear(start.getFullYear());
        setCalendarMonth(start.getMonth());
      } else {
        setCalendarYear(new Date().getFullYear());
        setCalendarMonth(new Date().getMonth());
      }
    } else {
      setEditingTrip(null);
      setTripTitle("");
      setTripBudget("");
      setTripStartDate(new Date().toISOString().split("T")[0]);
      setTripEndDate(new Date().toISOString().split("T")[0]);
      setTripMemo("");

      setCalendarYear(new Date().getFullYear());
      setCalendarMonth(new Date().getMonth());
    }
    setIsTripModalOpen(true);
  };

  // Handle Save Trip
  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripTitle.trim() || tripBudget === "") return;

    if (editingTrip) {
      // Edit
      const updated = trips.map((t) =>
        t.id === editingTrip.id
          ? {
              ...t,
              title: tripTitle,
              budget: Number(tripBudget),
              startDate: tripStartDate,
              endDate: tripEndDate,
              memo: tripMemo,
            }
          : t,
      );
      updateTrips(updated);
    } else {
      // Add
      const newTrip: Trip = {
        id: "trip_" + Date.now(),
        title: tripTitle,
        budget: Number(tripBudget),
        startDate: tripStartDate,
        endDate: tripEndDate,
        memo: tripMemo,
        createdAt: new Date().toISOString(),
      };
      updateTrips([newTrip, ...trips]);
      // Auto select and view the new trip
      setSelectedTripId(newTrip.id);
      setCurrentView("trip-detail");
    }
    setIsTripModalOpen(false);
  };

  // Handle Delete Trip
  const handleDeleteTrip = (id: string) => {
    if (
      window.confirm(
        "この旅行データを削除しますか？登録されたすべての支出も削除されます。",
      )
    ) {
      const updatedTrips = trips.filter((t) => t.id !== id);
      const updatedExpenses = expenses.filter((e) => e.tripId !== id);
      updateTrips(updatedTrips);
      updateExpenses(updatedExpenses);
      if (selectedTripId === id) {
        setSelectedTripId(null);
        setCurrentView("trip-list");
      }
    }
  };

  // Open Add/Edit Expense Modal
  const openExpenseModal = (expense: Expense | null = null) => {
    setIsCategoryDropdownOpen(false);
    setIsPaymentMethodDropdownOpen(false);
    if (expense) {
      setEditingExpense(expense);
      setExpenseTitle(expense.title);
      setExpenseAmount(expense.amount);
      setExpenseCategory(expense.category);
      setExpenseDate(expense.date);
      setExpensePaymentMethod(expense.paymentMethod);
      setExpenseMemo(expense.memo);
    } else {
      setEditingExpense(null);
      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseCategory("food");
      // Set to trip start date or today's date within trip range
      const today = new Date().toISOString().split("T")[0];
      if (activeTrip) {
        if (today >= activeTrip.startDate && today <= activeTrip.endDate) {
          setExpenseDate(today);
        } else {
          setExpenseDate(activeTrip.startDate);
        }
      } else {
        setExpenseDate(today);
      }
      setExpensePaymentMethod("cash");
      setExpenseMemo("");
    }
    setIsExpenseModalOpen(true);
  };

  // Handle Save Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || !expenseTitle.trim() || expenseAmount === "") return;

    if (editingExpense) {
      // Edit
      const updated = expenses.map((ex) =>
        ex.id === editingExpense.id
          ? {
              ...ex,
              title: expenseTitle,
              amount: Number(expenseAmount),
              category: expenseCategory,
              date: expenseDate,
              paymentMethod: expensePaymentMethod,
              memo: expenseMemo,
            }
          : ex,
      );
      updateExpenses(updated);
    } else {
      // Add
      const newExpense: Expense = {
        id: "exp_" + Date.now(),
        tripId: selectedTripId,
        title: expenseTitle,
        amount: Number(expenseAmount),
        category: expenseCategory,
        date: expenseDate,
        paymentMethod: expensePaymentMethod,
        memo: expenseMemo,
        createdAt: new Date().toISOString(),
      };
      updateExpenses([newExpense, ...expenses]);
    }
    setIsExpenseModalOpen(false);
  };

  // Handle Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (window.confirm("この支出を削除しますか？")) {
      const updated = expenses.filter((ex) => ex.id !== id);
      updateExpenses(updated);
    }
  };

  // Backup file export/import handler
  const handleBackupExport = () => {
    const dataStr = exportData();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `seisan_backup_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const success = importData(result);
        if (success) {
          alert("データの復元が完了しました。");
          setTrips(getTrips());
          setExpenses(getExpenses());
          setIsSettingsOpen(false);
        } else {
          alert("復元に失敗しました。ファイル形式を確認してください。");
        }
      }
    };
    fileReader.readAsText(file);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "警告: すべての旅行と支出データを削除しますか？この操作は取り消せません。",
      )
    ) {
      clearAllData();
      setTrips([]);
      setExpenses([]);
      setSelectedTripId(null);
      setCurrentView("trip-list");
      setIsSettingsOpen(false);
      alert("すべてのデータを削除しました。");
    }
  };

  // Custom SVG donut chart parameters
  const donutChartData = useMemo(() => {
    if (stats.totalSpent === 0) return [];

    return Object.entries(stats.byCategory)
      .map(([key, value]) => ({
        category: key as CategoryType,
        amount: value,
        percent: (value / stats.totalSpent) * 100,
        color: CATEGORIES[key as CategoryType].color,
        label: CATEGORIES[key as CategoryType].label,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [stats]);

  const svgDonutSlices = useMemo(() => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius; // ~219.91
    let currentOffset = 0;

    return donutChartData.map((item) => {
      const strokeLength = (item.percent / 100) * circumference;
      const sliceOffset = currentOffset;
      currentOffset -= strokeLength; // Advance offset clockwise

      return {
        ...item,
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: sliceOffset,
      };
    });
  }, [donutChartData]);

  // Group active expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: { [date: string]: Expense[] } = {};
    activeExpenses.forEach((e) => {
      if (!groups[e.date]) {
        groups[e.date] = [];
      }
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [activeExpenses]);

  return (
    <>
      {/* ==================== SCREEN UI ==================== */}
      <div
        className="no-print"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {/* Main Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            backgroundColor: "var(--bg-secondary)",
            borderBottom: "1px solid var(--border-color)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {currentView === "trip-detail" && (
              <button
                onClick={() => {
                  setSelectedTripId(null);
                  setCurrentView("trip-list");
                }}
                className="back-btn"
                style={{
                  background: "none",
                  color: "var(--text-secondary)",
                  padding: "4px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  marginRight: "4px",
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              {currentView === "trip-list" ? "旅の支出メモ" : activeTrip?.title}
            </h1>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="settings-btn"
            style={{
              background: "none",
              color: "var(--text-secondary)",
              padding: "6px",
              borderRadius: "50%",
            }}
          >
            <Settings size={20} />
          </button>
        </header>

        {/* ================= VIEW: TRIP LIST ================= */}
        {currentView === "trip-list" && (
          <main
            style={{
              padding: "20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              animation: "fadeIn var(--transition-fast)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "15px",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                旅行一覧
              </h2>
              <button
                onClick={() => openTripModal(null)}
                style={{
                  backgroundColor: "var(--color-sage)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: "var(--border-radius-lg)",
                  boxShadow: "var(--shadow-sm)",
                  gap: "4px",
                }}
              >
                <Plus size={14} /> 旅行を追加
              </button>
            </div>

            {trips.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "var(--border-radius-lg)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                <Info size={32} style={{ color: "var(--text-tertiary)" }} />
                <p style={{ fontSize: "14px" }}>
                  登録されている旅行はありません。
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  右上の「旅行を追加」から新しい旅の計画を作成しましょう。
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {trips.map((trip) => {
                  const tripExpenses = expenses.filter(
                    (e) => e.tripId === trip.id,
                  );
                  const totalSpent = tripExpenses.reduce(
                    (sum, e) => sum + e.amount,
                    0,
                  );
                  const isOverBudget = totalSpent > trip.budget;

                  return (
                    <div
                      key={trip.id}
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        setCurrentView("trip-detail");
                      }}
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        borderRadius: "var(--border-radius-lg)",
                        border: "1px solid var(--border-color)",
                        padding: "18px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        transition:
                          "transform var(--transition-fast), box-shadow var(--transition-fast)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              marginBottom: "4px",
                            }}
                          >
                            {trip.title}
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <Calendar size={12} />
                            <span>
                              {trip.startDate === trip.endDate
                                ? trip.startDate
                                : `${trip.startDate} 〜 ${trip.endDate}`}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                      </div>

                      {trip.memo && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            backgroundColor: "var(--bg-primary)",
                            padding: "8px 12px",
                            borderRadius: "var(--border-radius-sm)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {trip.memo}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                          borderTop: "1px solid var(--border-color)",
                          paddingTop: "12px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                              textTransform: "uppercase",
                            }}
                          >
                            総支出 / 予算
                          </span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              gap: "4px",
                              marginTop: "2px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: isOverBudget
                                  ? "var(--color-terracotta)"
                                  : "var(--text-primary)",
                              }}
                            >
                              {formatCurrency(totalSpent)}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-tertiary)",
                              }}
                            >
                              / {formatCurrency(trip.budget)}
                            </span>
                          </div>
                        </div>

                        {/* Tiny progress dot */}
                        <div
                          style={{
                            width: "60px",
                            height: "6px",
                            backgroundColor: "var(--bg-tertiary)",
                            borderRadius: "3px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0)}%`,
                              height: "100%",
                              backgroundColor: isOverBudget
                                ? "var(--color-terracotta)"
                                : "var(--color-sage)",
                              borderRadius: "3px",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {/* ================= VIEW: TRIP DETAIL ================= */}
        {currentView === "trip-detail" && activeTrip && (
          <main
            style={{
              padding: "16px 20px 80px 20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              animation: "fadeIn var(--transition-fast)",
            }}
          >
            {/* Header metadata */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <Calendar size={13} />
                <span>
                  {activeTrip.startDate === activeTrip.endDate
                    ? activeTrip.startDate
                    : `${activeTrip.startDate} 〜 ${activeTrip.endDate}`}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => openTripModal(activeTrip)}
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    padding: "6px 12px",
                    borderRadius: "var(--border-radius-sm)",
                    fontSize: "12px",
                    gap: "4px",
                  }}
                >
                  <Edit size={12} /> 編集
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: "var(--color-sage-light)",
                    color: "var(--color-sage-dark)",
                    padding: "6px 12px",
                    borderRadius: "var(--border-radius-sm)",
                    fontSize: "12px",
                    fontWeight: 500,
                    gap: "4px",
                  }}
                >
                  <FileText size={12} /> PDF出力
                </button>
              </div>
            </div>

            {/* Budget Progress Card */}
            <section
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--border-radius-lg)",
                border: "1px solid var(--border-color)",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <h3
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  予算進捗
                </h3>
                {stats.remaining < 0 ? (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-terracotta)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Info size={12} /> 予算を{" "}
                    {formatCurrency(Math.abs(stats.remaining))} 超過
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-sage-dark)",
                      fontWeight: 500,
                    }}
                  >
                    残り {formatCurrency(stats.remaining)}
                  </span>
                )}
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "24px", fontWeight: 700 }}>
                    {formatCurrency(stats.totalSpent)}
                  </span>
                  <span
                    style={{ fontSize: "13px", color: "var(--text-tertiary)" }}
                  >
                    予算 {formatCurrency(activeTrip.budget)}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: "10px",
                    backgroundColor: "var(--bg-tertiary)",
                    borderRadius: "5px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, stats.percentSpent)}%`,
                      height: "100%",
                      backgroundColor:
                        stats.remaining < 0
                          ? "var(--color-terracotta)"
                          : "var(--color-sage)",
                      borderRadius: "5px",
                      transition: "width var(--transition-normal)",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Category Breakdown (Donut Chart & Legend) */}
            {activeExpenses.length > 0 && (
              <section
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "var(--border-radius-lg)",
                  border: "1px solid var(--border-color)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  カテゴリ内訳
                </h3>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    gap: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* SVG Donut Chart */}
                  <div
                    style={{
                      position: "relative",
                      width: "120px",
                      height: "120px",
                    }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      style={{
                        transform: "rotate(-90deg)",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke="var(--bg-tertiary)"
                        strokeWidth="12"
                      />
                      {svgDonutSlices.map((slice) => (
                        <circle
                          key={slice.category}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth="12"
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          className="chart-pie-segment"
                          style={{
                            transition: "stroke-dashoffset 0.5s ease",
                          }}
                        />
                      ))}
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        総件数
                      </div>
                      <div style={{ fontSize: "16px", fontWeight: 700 }}>
                        {activeExpenses.length}件
                      </div>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      flex: 1,
                      minWidth: "150px",
                    }}
                  >
                    {donutChartData.map((item) => (
                      <div
                        key={item.category}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: item.color,
                            }}
                          />
                          <span style={{ color: "var(--text-primary)" }}>
                            {item.label}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 600 }}>
                            {formatCurrency(item.amount)}
                          </span>
                          <span
                            style={{
                              color: "var(--text-tertiary)",
                              fontSize: "10px",
                              marginLeft: "4px",
                            }}
                          >
                            ({item.percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Expenses List */}
            <section
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  支出明細
                </h3>
                <span
                  style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
                >
                  {activeExpenses.length} 件の記録
                </span>
              </div>

              {activeExpenses.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "36px 20px",
                    backgroundColor: "var(--bg-secondary)",
                    borderRadius: "var(--border-radius-lg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                  }}
                >
                  支出が登録されていません。下の「＋」ボタンから追加してください。
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {groupedExpenses.map(([date, items]) => {
                    const dailyTotal = items.reduce(
                      (sum, item) => sum + item.amount,
                      0,
                    );

                    return (
                      <div
                        key={date}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        {/* Daily Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0 4px",
                            borderBottom: "1px solid var(--border-color)",
                            paddingBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {formatDate(date)}
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                            }}
                          >
                            {formatCurrency(dailyTotal)}
                          </span>
                        </div>

                        {/* Daily Items */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          {items.map((expense) => {
                            const cat = CATEGORIES[expense.category];
                            return (
                              <div
                                key={expense.id}
                                onClick={() => openExpenseModal(expense)}
                                style={{
                                  backgroundColor: "var(--bg-secondary)",
                                  padding: "12px 14px",
                                  borderRadius: "var(--border-radius-md)",
                                  border: "1px solid var(--border-color)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  boxShadow: "var(--shadow-sm)",
                                  transition:
                                    "transform var(--transition-fast)",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.transform =
                                    "scale(1.01)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.transform = "scale(1)")
                                }
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {/* Category Dot */}
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      backgroundColor: cat.color,
                                      flexShrink: 0,
                                    }}
                                  />

                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      flex: 1,
                                      minWidth: 0,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "var(--text-primary)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {expense.title}
                                    </span>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "6px",
                                        alignItems: "center",
                                        fontSize: "11px",
                                        color: "var(--text-tertiary)",
                                      }}
                                    >
                                      <span>{cat.label}</span>
                                      <span>•</span>
                                      <span>
                                        {
                                          PAYMENT_METHODS[expense.paymentMethod]
                                            .label
                                        }
                                      </span>
                                      {expense.memo && (
                                        <>
                                          <span>•</span>
                                          <span
                                            style={{
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              maxWidth: "120px",
                                            }}
                                          >
                                            {expense.memo}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    marginLeft: "12px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {formatCurrency(expense.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Add Expense FAB (Sticky Footer button) */}
            <div
              style={{
                position: "fixed",
                bottom: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "100%",
                maxWidth: "440px",
                padding: "0 20px",
                zIndex: 5,
              }}
            >
              <button
                onClick={() => openExpenseModal(null)}
                style={{
                  width: "100%",
                  backgroundColor: "var(--color-sage)",
                  color: "white",
                  padding: "14px 20px",
                  borderRadius: "var(--border-radius-lg)",
                  fontSize: "15px",
                  fontWeight: 600,
                  boxShadow: "var(--shadow-lg)",
                  gap: "6px",
                  border: "none",
                }}
              >
                <Plus size={18} /> 支出を追加する
              </button>
            </div>
          </main>
        )}
      </div>

      {/* ==================== PRINT ONLY COMPONENT ==================== */}
      {/* This view only displays when printing to PDF via @media print */}
      <div className="print-only">
        {activeTrip ? (
          <div className="print-container">
            <div className="print-report-header">
              <div>
                <h1 className="print-report-title">
                  {activeTrip.title} 旅行収支報告書
                </h1>
                <p
                  style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}
                >
                  日程: {activeTrip.startDate} 〜 {activeTrip.endDate}
                </p>
              </div>
              <div className="print-report-meta">
                <p>出力日: {new Date().toLocaleDateString("ja-JP")}</p>
                <p>作成: 旅の支出メモ アプリ</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="print-summary-cards">
              <div className="print-card">
                <div className="print-card-title">総予算</div>
                <div className="print-card-value">
                  {formatCurrency(activeTrip.budget)}
                </div>
              </div>
              <div className="print-card">
                <div className="print-card-title">支出総額</div>
                <div className="print-card-value">
                  {formatCurrency(stats.totalSpent)}
                </div>
              </div>
              <div className="print-card">
                <div className="print-card-title">残高 / 予算比</div>
                <div
                  className="print-card-value"
                  style={{ color: stats.remaining < 0 ? "#C87A6E" : "#000" }}
                >
                  {formatCurrency(stats.remaining)} (
                  {activeTrip.budget > 0
                    ? ((stats.totalSpent / activeTrip.budget) * 100).toFixed(0)
                    : 0}
                  %)
                </div>
              </div>
            </div>

            {activeTrip.memo && (
              <div
                style={{
                  border: "1px solid #DDD",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "24px",
                  backgroundColor: "#FAF9F6",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    fontWeight: "bold",
                    marginBottom: "4px",
                  }}
                >
                  旅行メモ
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.5" }}>
                  {activeTrip.memo}
                </div>
              </div>
            )}

            {/* Print Category Breakdown */}
            <h3
              style={{
                fontSize: "14px",
                borderBottom: "1px solid #333",
                paddingBottom: "4px",
                marginBottom: "12px",
              }}
            >
              カテゴリ別支出
            </h3>
            <div className="print-chart-summary">
              {Object.entries(stats.byCategory)
                .filter(([_, val]) => val > 0)
                .map(([key, val]) => {
                  const cat = CATEGORIES[key as CategoryType];
                  const percent =
                    stats.totalSpent > 0 ? (val / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={key} className="print-chart-item">
                      <div
                        className="print-chart-color-box"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span style={{ fontWeight: "bold" }}>{cat.label}:</span>
                      <span>
                        {formatCurrency(val)} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Print Transaction Table */}
            <h3
              style={{
                fontSize: "14px",
                borderBottom: "1px solid #333",
                paddingBottom: "4px",
                marginBottom: "12px",
                marginTop: "24px",
              }}
            >
              現金支払い
            </h3>

            {activeExpenses.filter(
              (expense) => expense.paymentMethod === "cash",
            ).length === 0 ? (
              <p style={{ fontSize: "12px", color: "#666" }}>
                現金での支出はありません。
              </p>
            ) : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>日付</th>
                    <th style={{ width: "40%" }}>項目・メモ</th>
                    <th style={{ width: "15%" }}>カテゴリ</th>
                    <th style={{ width: "15%" }}>支払方法</th>
                    <th style={{ width: "15%", textAlign: "right" }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeExpenses]
                    .filter((expense) => expense.paymentMethod === "cash")
                    .reverse()
                    .map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.date}</td>
                        <td>
                          <div style={{ fontWeight: "bold" }}>
                            {expense.title}
                          </div>
                          {expense.memo && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#555",
                                marginTop: "2px",
                              }}
                            >
                              {expense.memo}
                            </div>
                          )}
                        </td>
                        <td>{CATEGORIES[expense.category].label}</td>
                        <td>{PAYMENT_METHODS[expense.paymentMethod].label}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            <h3
              style={{
                fontSize: "14px",
                borderBottom: "1px solid #333",
                paddingBottom: "4px",
                marginBottom: "12px",
                marginTop: "24px",
              }}
            >
              その他の支払い
            </h3>

            {activeExpenses.filter(
              (expense) => expense.paymentMethod !== "cash",
            ).length === 0 ? (
              <p style={{ fontSize: "12px", color: "#666" }}>
                現金以外の支出はありません。
              </p>
            ) : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>日付</th>
                    <th style={{ width: "40%" }}>項目・メモ</th>
                    <th style={{ width: "15%" }}>カテゴリ</th>
                    <th style={{ width: "15%" }}>支払方法</th>
                    <th style={{ width: "15%", textAlign: "right" }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeExpenses]
                    .filter((expense) => expense.paymentMethod !== "cash")
                    .reverse()
                    .map((expense) => (
                      <tr key={expense.id}>
                        <td>{expense.date}</td>
                        <td>
                          <div style={{ fontWeight: "bold" }}>
                            {expense.title}
                          </div>
                          {expense.memo && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#555",
                                marginTop: "2px",
                              }}
                            >
                              {expense.memo}
                            </div>
                          )}
                        </td>
                        <td>{CATEGORIES[expense.category].label}</td>
                        <td>{PAYMENT_METHODS[expense.paymentMethod].label}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <p>印刷する旅行データが選択されていません。</p>
        )}
      </div>

      {/* ==================== MODAL: TRIP FORM ==================== */}
      {isTripModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(43, 58, 54, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setIsTripModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              width: "100%",
              maxWidth: "480px",
              borderTopLeftRadius: "var(--border-radius-lg)",
              borderTopRightRadius: "var(--border-radius-lg)",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
                {editingTrip ? "旅行を編集" : "新しい旅行を追加"}
              </h3>
              <button
                onClick={() => setIsTripModalOpen(false)}
                style={{ background: "none", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveTrip}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label htmlFor="trip-title">旅行先・旅行名</label>
                <input
                  id="trip-title"
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="例: 京都古都めぐり 2026"
                  required
                />
              </div>

              <div>
                <label htmlFor="trip-budget">予算 (円)</label>
                <input
                  id="trip-budget"
                  type="number"
                  value={tripBudget}
                  onChange={(e) =>
                    setTripBudget(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="例: 50000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label>旅行日程</label>
                <div
                  style={{
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--border-radius-md)",
                    padding: "16px",
                    backgroundColor: "var(--bg-primary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={prevMonth}
                      style={{
                        background: "none",
                        color: "var(--text-secondary)",
                        padding: "4px 12px",
                        fontSize: "16px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ◀
                    </button>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {calendarYear}年 {calendarMonth + 1}月
                    </span>
                    <button
                      type="button"
                      onClick={nextMonth}
                      style={{
                        background: "none",
                        color: "var(--text-secondary)",
                        padding: "4px 12px",
                        fontSize: "16px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      ▶
                    </button>
                  </div>

                  {/* Weekdays */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      textAlign: "center",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {weekDays.map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(7, 1fr)",
                      gap: "4px",
                    }}
                  >
                    {Array(firstDayIndex)
                      .fill(null)
                      .map((_, idx) => (
                        <div key={`empty-${idx}`} />
                      ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1;
                      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                      const isStart = tripStartDate === dateStr;
                      const isEnd = tripEndDate === dateStr;
                      const inRange =
                        tripStartDate &&
                        tripEndDate &&
                        dateStr > tripStartDate &&
                        dateStr < tripEndDate;
                      const isSelected = isStart || isEnd;

                      let bgStyle = "transparent";
                      let textStyle = "var(--text-primary)";
                      let borderRadiusStyle = "var(--border-radius-sm)";

                      if (isStart && isEnd) {
                        bgStyle = "var(--color-sage)";
                        textStyle = "#FFF";
                        borderRadiusStyle = "50%";
                      } else if (isStart) {
                        bgStyle = "var(--color-sage)";
                        textStyle = "#FFF";
                        borderRadiusStyle = "12px 0 0 12px";
                      } else if (isEnd) {
                        bgStyle = "var(--color-sage)";
                        textStyle = "#FFF";
                        borderRadiusStyle = "0 12px 12px 0";
                      } else if (inRange) {
                        bgStyle = "var(--color-sage-light)";
                        textStyle = "var(--color-sage-dark)";
                        borderRadiusStyle = "0";
                      }

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            if (
                              !tripStartDate ||
                              (tripStartDate &&
                                tripEndDate &&
                                tripStartDate !== tripEndDate)
                            ) {
                              setTripStartDate(dateStr);
                              setTripEndDate(dateStr);
                            } else {
                              if (dateStr >= tripStartDate) {
                                setTripEndDate(dateStr);
                              } else {
                                setTripStartDate(dateStr);
                                setTripEndDate(dateStr);
                              }
                            }
                          }}
                          style={{
                            height: "34px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: bgStyle,
                            color: textStyle,
                            borderRadius: borderRadiusStyle,
                            border: "none",
                            fontSize: "13px",
                            fontWeight: isSelected ? 700 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {tripStartDate && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--border-radius-md)",
                      padding: "8px 12px",
                      textAlign: "center",
                      marginTop: "8px",
                    }}
                  >
                    日程: <strong>{tripStartDate}</strong> 〜{" "}
                    <strong>{tripEndDate || "選択中..."}</strong>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="trip-memo">メモ・計画</label>
                <textarea
                  id="trip-memo"
                  value={tripMemo}
                  onChange={(e) => setTripMemo(e.target.value)}
                  placeholder="例: 行きたいお寺やお店、持ち物など"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--border-color)",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                {editingTrip && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteTrip(editingTrip.id);
                      setIsTripModalOpen(false);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "var(--color-terracotta-light)",
                      color: "var(--color-terracotta)",
                      padding: "14px",
                      borderRadius: "var(--border-radius-md)",
                      fontWeight: 600,
                      gap: "6px",
                    }}
                  >
                    <Trash2 size={16} /> 削除
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    flex: editingTrip ? 2 : 1,
                    backgroundColor: "var(--color-sage)",
                    color: "white",
                    padding: "14px",
                    borderRadius: "var(--border-radius-md)",
                    fontWeight: 600,
                  }}
                >
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EXPENSE FORM ==================== */}
      {isExpenseModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(43, 58, 54, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => setIsExpenseModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              width: "100%",
              maxWidth: "480px",
              borderTopLeftRadius: "var(--border-radius-lg)",
              borderTopRightRadius: "var(--border-radius-lg)",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "90vh",
              overflowY: "auto",
              animation: "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
                {editingExpense ? "支出を編集" : "支出を記録"}
              </h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ background: "none", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSaveExpense}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label htmlFor="exp-title">支払項目・店名</label>
                <input
                  id="exp-title"
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="例: カフェでのランチ、拝観料など"
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-amount">金額 (円)</label>
                <input
                  id="exp-amount"
                  type="number"
                  value={expenseAmount}
                  onChange={(e) =>
                    setExpenseAmount(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="例: 1200"
                  min="1"
                  required
                />
              </div>

              <div>
                <label>支払日</label>
                {tripDates.length === 0 ? (
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      overflowX: "auto",
                      padding: "4px 2px 10px 2px",
                      scrollSnapType: "x mandatory",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {tripDates.map((date) => {
                      const isSelected = expenseDate === date;
                      const parsedDate = new Date(date);
                      const dayLabel = parsedDate.getDate();
                      const weekdayLabel = new Intl.DateTimeFormat("ja-JP", {
                        weekday: "short",
                      }).format(parsedDate);
                      const monthLabel = parsedDate.getMonth() + 1;

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => setExpenseDate(date)}
                          style={{
                            flex: "0 0 auto",
                            scrollSnapAlign: "start",
                            padding: "10px 14px",
                            borderRadius: "var(--border-radius-md)",
                            border: isSelected
                              ? "2px solid var(--color-sage)"
                              : "1px solid var(--border-color)",
                            backgroundColor: isSelected
                              ? "var(--color-sage-light)"
                              : "var(--bg-secondary)",
                            color: isSelected
                              ? "var(--color-sage-dark)"
                              : "var(--text-primary)",
                            textAlign: "center",
                            minWidth: "65px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            cursor: "pointer",
                            transition: "all var(--transition-fast)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              color: isSelected
                                ? "var(--color-sage-dark)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {monthLabel}月
                          </span>
                          <span style={{ fontSize: "16px", fontWeight: 700 }}>
                            {dayLabel}
                          </span>
                          <span style={{ fontSize: "10px", opacity: 0.8 }}>
                            ({weekdayLabel})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Invisible overlay to close dropdowns on clicking outside */}
              {(isCategoryDropdownOpen || isPaymentMethodDropdownOpen) && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9,
                    background: "transparent",
                  }}
                  onClick={() => {
                    setIsCategoryDropdownOpen(false);
                    setIsPaymentMethodDropdownOpen(false);
                  }}
                />
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  position: "relative",
                }}
              >
                {/* Category Custom Dropdown */}
                <div style={{ position: "relative", zIndex: 10 }}>
                  <label htmlFor="exp-category">カテゴリ</label>
                  <button
                    id="exp-category"
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setIsPaymentMethodDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "var(--border-radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      width: "100%",
                      fontSize: "15px",
                      textAlign: "left",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: CATEGORIES[expenseCategory].color,
                        }}
                      />
                      <span>{CATEGORIES[expenseCategory].label}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--border-radius-md)",
                        boxShadow: "var(--shadow-lg)",
                        zIndex: 11,
                        maxHeight: "220px",
                        overflowY: "auto",
                        animation: "fadeIn var(--transition-fast)",
                      }}
                    >
                      {Object.values(CATEGORIES).map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => {
                            setExpenseCategory(cat.key);
                            setIsCategoryDropdownOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            width: "100%",
                            backgroundColor:
                              expenseCategory === cat.key
                                ? "var(--bg-tertiary)"
                                : "transparent",
                            border: "none",
                            textAlign: "left",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--bg-tertiary)")
                          }
                          onMouseLeave={(e) => {
                            if (expenseCategory !== cat.key) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: cat.color,
                            }}
                          />
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method Custom Dropdown */}
                <div style={{ position: "relative", zIndex: 10 }}>
                  <label htmlFor="exp-pay-method">支払方法</label>
                  <button
                    id="exp-pay-method"
                    type="button"
                    onClick={() => {
                      setIsPaymentMethodDropdownOpen(
                        !isPaymentMethodDropdownOpen,
                      );
                      setIsCategoryDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "var(--border-radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-secondary)",
                      width: "100%",
                      fontSize: "15px",
                      textAlign: "left",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    <span>{PAYMENT_METHODS[expensePaymentMethod].label}</span>
                    <ChevronDown
                      size={16}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>

                  {isPaymentMethodDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--border-radius-md)",
                        boxShadow: "var(--shadow-lg)",
                        zIndex: 11,
                        maxHeight: "220px",
                        overflowY: "auto",
                        animation: "fadeIn var(--transition-fast)",
                      }}
                    >
                      {Object.values(PAYMENT_METHODS).map((method) => (
                        <button
                          key={method.key}
                          type="button"
                          onClick={() => {
                            setExpensePaymentMethod(method.key);
                            setIsPaymentMethodDropdownOpen(false);
                          }}
                          style={{
                            display: "block",
                            padding: "12px 16px",
                            width: "100%",
                            backgroundColor:
                              expensePaymentMethod === method.key
                                ? "var(--bg-tertiary)"
                                : "transparent",
                            border: "none",
                            textAlign: "left",
                            color: "var(--text-primary)",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--bg-tertiary)")
                          }
                          onMouseLeave={(e) => {
                            if (expensePaymentMethod !== method.key) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                            }
                          }}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="exp-memo">メモ</label>
                <input
                  id="exp-memo"
                  type="text"
                  value={expenseMemo}
                  onChange={(e) => setExpenseMemo(e.target.value)}
                  placeholder="例: クレジット家族カード使用、など"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                {editingExpense && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteExpense(editingExpense.id);
                      setIsExpenseModalOpen(false);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "var(--color-terracotta-light)",
                      color: "var(--color-terracotta)",
                      padding: "14px",
                      borderRadius: "var(--border-radius-md)",
                      fontWeight: 600,
                      gap: "6px",
                    }}
                  >
                    <Trash2 size={16} /> 削除
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    flex: editingExpense ? 2 : 1,
                    backgroundColor: "var(--color-sage)",
                    color: "white",
                    padding: "14px",
                    borderRadius: "var(--border-radius-md)",
                    fontWeight: 600,
                  }}
                >
                  記録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: SETTINGS & BACKUP ==================== */}
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(43, 58, 54, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
            padding: "20px",
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--bg-secondary)",
              width: "100%",
              maxWidth: "400px",
              borderRadius: "var(--border-radius-lg)",
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "var(--shadow-lg)",
              animation: "scaleIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
                アプリ設定・データ管理
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: "none", color: "var(--text-secondary)" }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Export backup button */}
              <div>
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  データのバックアップ
                </h4>
                <button
                  onClick={handleBackupExport}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    padding: "12px",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "13px",
                    fontWeight: 500,
                    gap: "8px",
                  }}
                >
                  <Download size={14} /> バックアップファイル (.json) の保存
                </button>
              </div>

              {/* Import backup */}
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "14px",
                }}
              >
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  データの復元
                </h4>
                <label
                  htmlFor="backup-file"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    padding: "12px",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background-color var(--transition-fast)",
                  }}
                >
                  <Upload size={14} /> バックアップファイルを読み込む
                </label>
                <input
                  type="file"
                  id="backup-file"
                  accept=".json"
                  onChange={handleBackupImport}
                  style={{ display: "none" }}
                />
              </div>

              {/* Clear data */}
              <div
                style={{
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: "14px",
                }}
              >
                <h4
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--color-terracotta)",
                    marginBottom: "8px",
                  }}
                >
                  データの初期化
                </h4>
                <button
                  onClick={handleClearAll}
                  style={{
                    width: "100%",
                    backgroundColor: "var(--color-terracotta-light)",
                    color: "var(--color-terracotta)",
                    padding: "12px",
                    borderRadius: "var(--border-radius-md)",
                    fontSize: "13px",
                    fontWeight: 600,
                    gap: "8px",
                  }}
                >
                  <Trash2 size={14} /> すべてのデータを削除する
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                backgroundColor: "var(--color-sage-light)",
                padding: "12px",
                borderRadius: "var(--border-radius-md)",
                fontSize: "11px",
                color: "var(--color-sage-dark)",
                lineHeight: 1.5,
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
              <div>
                データはすべてお使いのスマートフォンのブラウザ内 (localStorage)
                にのみ保存されます。アプリ外に送信されることはありません。
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
