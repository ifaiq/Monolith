import { Injectable } from "@angular/core";

@Injectable()
export class LocationService {
    workingDays = [
        {
            name: "Sunday",
            id: 1
        },
        {
            name: "Monday",
            id: 2
        },
        {
            name: "Tuesday",
            id: 3
        },
        {
            name: "Wednesday",
            id: 4
        },
        {
            name: "Thrusday",
            id: 5
        },
        {
            name: "Friday",
            id: 6
        },
        {
            name: "Saturday",
            id: 7
        },
    ];

    constructor() { }

    validateTime(time) {
        if (!time) {
            return false;
        } else if (!time.hour && time.hour != 0) {
            return false;
        } else if (!time.minute && time.minute != 0) {
            return false;
        } else {
            return true;
        }
    }

    compareStartAndEndTime(start_time, end_time) {
        if (start_time.hour > end_time.hour) {
            return false;
        } else if (start_time.hour < end_time.hour) {
            return true;
        } else if (start_time.minute < end_time.minute) {
            return true;
        } else {
            return false;
        }
    }

    isValidDeliveryTime(delivery_time) {
        if (!(delivery_time.hour || delivery_time.minute)) {
            return false;
        }
        return true;
    }

    validateStoreTimings(location) {
        let days = location.operating_days.filter(item => item.disabled == 0);
        if (days.length == 0 && !location.disabled) {
            return "Please select atleast one operating day";
        }
        if (!location.is_day_wise_time) {
            if (!this.validateTime(location.start_time)) {
                return "Day start time required";
            }
            if (location.start_time.hour > 23 || location.start_time.minute > 59 || location.start_time.second > 59) {
                return "Invalid start time";
            }
            if (!this.validateTime(location.end_time)) {
                return "Day end time required";
            }
            if (location.end_time.hour > 23 || location.end_time.minute > 59 || location.end_time.second > 59) {
                return "Invalid end time";
            }
            if (
                !this.compareStartAndEndTime(
                    location.start_time,
                    location.end_time
                )
            ) {
                return "Day start time must before end time";
            }
        } else {
            let msg = "";
            for (
                var index = 0;
                index < location.operating_days.length;
                index++
            ) {
                let day = location.operating_days[index];
                if (day.disabled) {
                    continue;
                }
                if (!this.validateTime(day.start_time)) {
                    msg = "Day start time required";
                    break;
                }
                if (!this.validateTime(day.end_time)) {
                    msg = "Day end time required";
                    break;
                }
                if (
                    !this.compareStartAndEndTime(day.start_time, day.end_time)
                ) {
                    msg = "Day start time must before end time";
                    break;
                }
            }
            if (msg) {
                return msg;
            }
        }
        if (!this.isValidDeliveryTime(location.delivery_time)) {
            return "Minimum delivery time is required field";
        }
        return "";
    }

    getTimeTwoDigit(time) {
        let hourStr = time.hour + "";
        if (!hourStr) {
            hourStr = "00";
        }
        else if (hourStr.length == 1) {
            hourStr = "0" + time.hour;
        }
        let minStr = time.minute + "";
        if (!minStr) {
            minStr = "00";
        }
        else if (minStr.length == 1) {
            minStr = "0" + time.minute;
        }
        return (hourStr + ":" + minStr + ":" + "00");
    }

    getSqlDateObject(date) {
        let start_date = new Date(date);
        let full_year = start_date.getFullYear();
        let full_month = (start_date.getMonth() + 1) + "";
        if (full_month.length == 1) {
            full_month = "0" + (start_date.getMonth() + 1);
        }
        let full_day = start_date.getDate() + "";
        if (full_day.length == 1) {
            full_day = "0" + start_date.getDate();
        }
        return (full_year + "-" + full_month + "-" + full_day);

    }

    getDataToSave(location) {
        let data = JSON.parse(JSON.stringify(location));
        for (var index = 0; index < data.operating_days.length; index++) {
            let day = data.operating_days[index];
            if (location.is_day_wise_time) {
                day.start_time = this.getTimeTwoDigit(day.start_time);
                day.end_time = this.getTimeTwoDigit(day.end_time);
            } else {
                day.start_time = this.getTimeTwoDigit(data.start_time);
                day.end_time = this.getTimeTwoDigit(data.end_time);
            }
        }
        delete data.start_time;
        delete data.end_time;
        if (data.delivery_time)
            data.delivery_time = this.getTimeTwoDigit(data.delivery_time);
        if (data.events) {
            for (var index = 0; index < data.events.length; index++) {
                let event = data.events[index];
                event.start_time = this.getTimeTwoDigit(event.start_time);
                event.end_time = this.getTimeTwoDigit(event.end_time);
                event.start_date = this.getSqlDateObject(event.start_date);
                event.end_date = this.getSqlDateObject(event.end_date);
            }
        } else {
            data.events = [];
        }
        return data;
    }

    setDataForLocation(location) {
        let data = JSON.parse(JSON.stringify(location));
        for (var index = 0; index < data.operating_days.length; index++) {
            let day = data.operating_days[index];
            let split = day.start_time.split(":");
            day.start_time = {
                hour: Number(split[0]),
                minute: Number(split[1])
            };
            split = day.end_time.split(":");
            day.end_time = {
                hour: Number(split[0]),
                minute: Number(split[1])
            };
            day.day_name = this.workingDays.filter(
                item => item.id === day.day_id
            )[0].name;
        }
        if (data.delivery_time) {
            let split = data.delivery_time.split(":");
            data.delivery_time = {
                hour: Number(split[0]),
                minute: Number(split[1])
            };
        }
        if (data.operating_days && data.operating_days[0] && data.operating_days[0].start_time)
            data.start_time = {
                hour: data.operating_days[0].start_time.hour,
                minute: data.operating_days[0].start_time.minute
            };
        if (data.operating_days && data.operating_days[0] && data.operating_days[0].end_time)
            data.end_time = {
                hour: data.operating_days[0].end_time.hour,
                minute: data.operating_days[0].end_time.minute
            };
        if (data.events) {
            for (var index = 0; index < data.events.length; index++) {
                let event = data.events[index];
                let split = event.start_time.split(":");
                event.start_time = {
                    hour: Number(split[0]),
                    minute: Number(split[1])
                };
                split = event.end_time.split(":");
                event.end_time = {
                    hour: Number(split[0]),
                    minute: Number(split[1])
                };
                event.start_date = new Date(event.start_date);
                event.end_date = new Date(event.end_date);
            }
        } else {
            data.events = [];
        }
        return data;
    }

    isOtherEventWithInRange(startIndex, location) {
        let mainEvent = location.events[startIndex - 1];
        let date = new Date(mainEvent.start_date);
        let start_date = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
        date = new Date(mainEvent.end_date);
        let end_date = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
        let msg = "";
        if (start_date > end_date) {
            return "End Date must be greater or equal to start date";
        }
        for (var index = startIndex; index < location.events.length; index++) {
            let event = location.events[index];
            date = new Date(event.start_date);
            let temp_start_date = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            date = new Date(event.end_date);
            let temp_end_date = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            );
            if (end_date < temp_start_date || start_date > temp_end_date) {
            } else {
                msg =
                    "Event " +
                    startIndex +
                    "&" +
                    (index + 1) +
                    " must not have overlapping dates";
                break;
            }
        }
        return msg;
    }

    validateEvents(location) {
        if (!location.events) {
            return "";
        }
        let msg = "";
        for (var index = 0; index < location.events.length; index++) {
            let event = location.events[index];
            if (!this.validateTime(event.start_time)) {
                msg = "Event " + (index + 1) + "start time missing";
                break;
            }
            if (!this.validateTime(event.end_time)) {
                msg = "Event " + (index + 1) + "end time missing";
                break;
            }
            if (
                !this.compareStartAndEndTime(event.start_time, event.end_time)
            ) {
                msg = "Event start time must before end time";
                break;
            }
            msg = this.isOtherEventWithInRange(index + 1, location);
            if (msg) {
                break;
            }
        }
        return msg;
    }
}
