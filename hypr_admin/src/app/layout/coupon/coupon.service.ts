import { Injectable } from '@angular/core';

@Injectable()
export class CouponService {

	couponList = [];
	selectedCouponIndex = -1;

	selectedCouponOption = 'selected';
	freeOption = 'free';

	couponCodeRegex = "[A-Za-z0-9_\\-]+";
	couponNameRegex = "[A-Za-z0-9_'\\- ]+";

	selectedCustomerOption = 2;
	allSkuOption = 0 ;

	coupon_discount_types = [{
		id: 1,
		name: 'Percentage Discount',
		value: 'percentage'
	}, {
		id: 2,
		name: 'Fixed Amount',
		value: 'fixed'
	}]

	coupon_customer_options = [{
		id: 1,
		name: 'Everyone',
		value: 'everyone'
	}, {
		id: 2,
		name: 'Selected Customers',
		value: 'selected'
	}]

	coupon_sku_options = [{
		id: 0,
		name: 'All SKUs',
	}, {
		id: 1,
		name: 'Select SKUs to Whitelist',
	}, {
		id: 2,
		name: 'Select SKUs to Blacklist',
	}]

	settings = {
        bigBanner: true,
        timePicker: false,
        format: "dd-MMM-yyyy",
        defaultOpen: false,
    };

	coupon_user_types = [{
		id: 1,
		name: 'Consumer',
		value: [8],
        strValue: '8',
	}, {
		id: 2,
		name: 'Supervisor',
		value: [16],
        strValue: '16',
	}, {
		id: 3,
		name: 'Both',
		value: [8,16],
        strValue: '8,16',
	}]

	constructor() {
	}

	getNumberFromString(event) {
		if (event) {
			var charFree = event.replace(/[^0-9]/g, "")
			return parseInt(charFree);
		}
		return 0;
	}

	isNumberKey(evt) {
		var charCode = evt.which ? evt.which : evt.keyCode;
		if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
		return true;
	}

	getDateWithOutTime(date){
        let startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        return startDate;
    }

	validateCouponDates(start_date, end_date){
		const today = this.getDateWithOutTime(new Date());
		const startDate = this.getDateWithOutTime(start_date);
        const endDate = this.getDateWithOutTime(end_date);
		if (endDate < startDate) {
			return "Coupon End date must be greater than or equal to start date"
		}
		else if(endDate < today) {
			return "Coupon End date must be greater than or equal to today"
		}
		else{
			return ""
		}
	}

	validateCoupon(coupon, file?){
        const selected_user_type = this.coupon_user_types.filter(type => type.strValue === coupon.userTypeId)
		if(!coupon.name){
			return "Coupon Name required";
		}
		else if(!coupon.startDate){
			return "Coupon Start Date required";
		}
		else if(!coupon.endDate){
			return "Coupon End Date required";
		}
		else if(this.validateCouponDates(coupon.startDate, coupon.endDate)){
			return this.validateCouponDates(coupon.startDate, coupon.endDate);
		}
		else if(coupon.couponDiscountTypeId == 1 && coupon.discountValue >= 100){
			return "Discount Percentage must be less than 100";
		}
		else if(!coupon.discountValue || coupon.discountValue<=0){
			return "Coupon discount value required";
		}
		else if(!coupon.businessUnitId){
			return "Coupon Business Unit required";
		}
		else if(!coupon.locationId){
			return "Coupon Location required";
		}
		else if((!coupon.couponCustomers || coupon.couponCustomers.length==0) && !file
		&& coupon.couponCustomerOptionId == this.selectedCustomerOption
		){
			return "Select atleast one customer for coupon";
		}
        else if(selected_user_type.length === 0) {
            return "Coupon User required";
        }
		return "";
	}

	getCouponToSave(coupon){
		let data = JSON.parse(JSON.stringify(coupon));
		let customers = [];
        if(data.couponCustomers){
            for(let index=0; index< data.couponCustomers.length; index++){
                customers.push(data.couponCustomers[index].id);
            }
		}
		data.couponCustomers = customers;
		data.startDate = this.getSqlDateObject(data.startDate);
		data.endDate = this.getSqlDateObject(data.endDate);
		data.name = data.name.trim();
		data.discountTypeId = +data.discountTypeId;
		return data;
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
	
	removeSelectedCustomer(coupon, customer) {
        let ci = coupon.couponCustomers.indexOf(customer);
        if (ci >= 0) {
            coupon.couponCustomers.splice(ci, 1);
        }
	}
	
	addCustomerById(coupon, customer){
		let isAlreadySelected = coupon.couponCustomers.filter(item=>item.customer_id===customer.customer_id);
		if(isAlreadySelected.length==0){
			coupon.couponCustomers.push({
				id:0,
				customer_id:customer.id,
				customer_name: customer.name,
				customer_phone: customer.phone
			});
		}
	}

	getFormattedDate(date) {
		date = this.getDateWithOutTime(date);
		return (date.getDate() + "-" + date.toLocaleString('default', { month: 'short' }) + "-" + date.getFullYear());
	}
}
