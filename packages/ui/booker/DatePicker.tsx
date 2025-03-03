import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/solid";
import dayjs, { Dayjs } from "dayjs";
import isToday from "dayjs/plugin/isToday";

import classNames from "@calcom/lib/classNames";
import { daysInMonth, yyyymmdd } from "@calcom/lib/date-fns";
import { weekdayNames } from "@calcom/lib/weekday";
import { SkeletonText } from "@calcom/ui/skeleton";

dayjs.extend(isToday);

export type DatePickerProps = {
  /** which day of the week to render the calendar. Usually Sunday (=0) or Monday (=1) - default: Sunday */
  weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Fires whenever a selected date is changed. */
  onChange: (date: Dayjs) => void;
  /** Fires when the month is changed. */
  onMonthChange?: (date: Dayjs) => void;
  /** which date is currently selected (not tracked from here) */
  selected?: Dayjs;
  /** defaults to current date. */
  minDate?: Dayjs;
  /** Furthest date selectable in the future, default = UNLIMITED */
  maxDate?: Dayjs;
  /** locale, any IETF language tag, e.g. "hu-HU" - defaults to Browser settings */
  locale: string;
  /** Defaults to [], which dates are not bookable. Array of valid dates like: ["2022-04-23", "2022-04-24"] */
  excludedDates?: string[];
  /** defaults to all, which dates are bookable (inverse of excludedDates) */
  includedDates?: string[];
  /** allows adding classes to the container */
  className?: string;
  /** Shows a small loading spinner next to the month name */
  isLoading?: boolean;
};

export const Day = ({
  date,
  active,
  ...props
}: JSX.IntrinsicElements["button"] & { active: boolean; date: Dayjs }) => {
  return (
    <button
      className={classNames(
        "hover:border-brand disabled:text-bookinglighter absolute top-0 left-0 right-0 bottom-0 mx-auto w-full rounded-sm border border-transparent text-center font-medium disabled:cursor-default disabled:border-transparent disabled:font-light dark:hover:border-white disabled:dark:border-transparent",
        active
          ? "bg-brand text-brandcontrast dark:bg-darkmodebrand dark:text-darkmodebrandcontrast"
          : !props.disabled
          ? " bg-gray-100 dark:bg-gray-600 dark:text-white"
          : ""
      )}
      data-testid="day"
      data-disabled={props.disabled}
      {...props}>
      {date.date()}
      {date.isToday() && <span className="absolute left-0 bottom-0 mx-auto -mb-px w-full text-4xl">.</span>}
    </button>
  );
};

const Days = ({
  // minDate,
  excludedDates = [],
  includedDates,
  browsingDate,
  weekStart,
  DayComponent = Day,
  selected,
  ...props
}: Omit<DatePickerProps, "locale" | "className" | "weekStart"> & {
  DayComponent?: React.FC<React.ComponentProps<typeof Day>>;
  browsingDate: Dayjs;
  weekStart: number;
}) => {
  // Create placeholder elements for empty days in first week
  const weekdayOfFirst = browsingDate.day();

  const days: (Dayjs | null)[] = Array((weekdayOfFirst - weekStart + 7) % 7).fill(null);
  for (let day = 1, dayCount = daysInMonth(browsingDate); day <= dayCount; day++) {
    const date = browsingDate.set("date", day);
    days.push(date);
  }

  return (
    <>
      {days.map((day, idx) => (
        <div key={day === null ? `e-${idx}` : `day-${day.format()}`} className="relative w-full pt-[100%]">
          {day === null ? (
            <div key={`e-${idx}`} />
          ) : props.isLoading ? (
            <button
              className="absolute top-0 left-0 right-0 bottom-0 mx-auto flex w-full items-center justify-center rounded-sm border-transparent bg-gray-50 text-center text-gray-400 opacity-50 dark:bg-gray-900 dark:text-gray-400"
              key={`e-${idx}`}
              disabled>
              <SkeletonText width="5" height="4" />
            </button>
          ) : (
            <DayComponent
              date={day}
              onClick={() => {
                props.onChange(day);
                window.scrollTo({
                  top: 360,
                  behavior: "smooth",
                });
              }}
              disabled={
                (includedDates && !includedDates.includes(yyyymmdd(day))) ||
                excludedDates.includes(yyyymmdd(day))
              }
              active={selected ? yyyymmdd(selected) === yyyymmdd(day) : false}
            />
          )}
        </div>
      ))}
    </>
  );
};

const DatePicker = ({
  weekStart = 0,
  className,
  locale,
  selected,
  onMonthChange,
  ...passThroughProps
}: DatePickerProps & Partial<React.ComponentProps<typeof Days>>) => {
  const browsingDate = passThroughProps.browsingDate || dayjs().startOf("month");

  const changeMonth = (newMonth: number) => {
    if (onMonthChange) {
      onMonthChange(browsingDate.add(newMonth, "month"));
    }
  };

  return (
    <div className={className}>
      <div className="mb-4 flex justify-between text-xl font-light">
        <span className="w-1/2 dark:text-white">
          {browsingDate ? (
            <>
              <strong className="text-bookingdarker dark:text-white">
                {browsingDate.toDate().toLocaleString(locale, {
                  month: "long",
                })}
              </strong>{" "}
              <span className="text-bookinglight">{browsingDate.format("YYYY")}</span>
            </>
          ) : (
            <SkeletonText width="24" height="8" />
          )}
        </span>
        <div className="text-black dark:text-white">
          <button
            onClick={() => changeMonth(-1)}
            className={classNames(
              "group p-1 opacity-50 hover:opacity-100 ltr:mr-2 rtl:ml-2",
              !browsingDate.isAfter(dayjs()) && "disabled:text-bookinglighter hover:opacity-50"
            )}
            disabled={!browsingDate.isAfter(dayjs())}
            data-testid="decrementMonth">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            className="group p-1 opacity-50 hover:opacity-100"
            onClick={() => changeMonth(+1)}
            data-testid="incrementMonth">
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="border-bookinglightest mb-2 grid grid-cols-7 gap-4 border-t border-b text-center dark:border-gray-800 md:mb-0 md:border-0">
        {weekdayNames(locale, weekStart, "short").map((weekDay) => (
          <div key={weekDay} className="text-bookinglight my-4 text-xs uppercase tracking-widest">
            {weekDay}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        <Days weekStart={weekStart} selected={selected} {...passThroughProps} browsingDate={browsingDate} />
      </div>
    </div>
  );
};

export default DatePicker;
