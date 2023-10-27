const xlsx = require("xlsx");

const countInArray = (array, element) => {
  return array.filter(item => item == element).length;
}
const readCSV = (fileName, s3) => {
    const s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: fileName};
    const stream = s3.getObject(s3Options).createReadStream();
   
    return new Promise((resolve, reject) => {
        const _buff = [];
        stream.on("data", (chunk) => _buff.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(_buff)))
        stream.on("error", reject);
    })
}

const getS3Url =async (fileName, s3) => {
  const s3Options = { Bucket: sails.config.globalConf.AWS_BUCKET, Key: fileName};
  const url = await s3.getSignedUrl('getObject', s3Options);
  if(url){
    return url.split('?')[0]
  }else{
    return null
  }
}

const convertCsvBufferToJson = (_buff) => {
    const workbook = xlsx.read(_buff);
    const sheetNameList = workbook.SheetNames;
    return xlsx.utils.sheet_to_json(
        workbook.Sheets[sheetNameList[0]], {
            defval: '',
            blankrows: false,
            header: 0,
            raw: false,
        }
      );
}

const validateMissingPriorityData  =  (data) =>{
    const anyMissingProductId = data.find(datum => !datum[Object.keys(datum)[0]] || datum[Object.keys(datum)[0]] === '');
    const anyMissingCategoryId = data.find(datum => !datum[Object.keys(datum)[2]] || datum[Object.keys(datum)[2]] === '');
    const anyMissingSubCategoryId = data.find(datum => !datum[Object.keys(datum)[3]] || datum[Object.keys(datum)[3]] === '');
    if(anyMissingProductId){
      return {
        failure: true,
        reason: Object.keys(anyMissingProductId)[0],
      }
    }
    if(anyMissingCategoryId){
      return {
        failure: true,
        reason: Object.keys(anyMissingCategoryId)[2],
      }
    }

    if(anyMissingSubCategoryId){
      return{
        failure: true,
        reason: Object.keys(anyMissingSubCategoryId)[3],
      }
    }

    return {
      failure: false
    }

  }

  const validatePriorityDataIds = (data) => {
    const invalidProductId = data.find(datum => isNaN(datum[Object.keys(datum)[0]]));
    const invalidCategoryId = data.find(datum => isNaN(datum[Object.keys(datum)[2]]));
    const invalidSubCategoryId = data.find(datum => isNaN(datum[Object.keys(datum)[3]]));
  
    if(invalidProductId){
      return {
        failure: true,
        reason: Object.keys(invalidProductId)[0],
      }
    }
    if(invalidCategoryId){
      return {
        failure: true,
        reason: Object.keys(invalidCategoryId)[2],
      }
    }

    if(invalidSubCategoryId){
      return{
        failure: true,
        reason: Object.keys(invalidSubCategoryId)[3],
      }
    }

    return {
      failure: false
    }  
  }

  const validatePriorities = (data) => {
    const invalidL1Priority = data.find(datum => datum[Object.keys(datum)[4]] <= 0 );
    const invalidL2Priority = data.find(datum => datum[Object.keys(datum)[5]] <= 0 );

    if(invalidL1Priority) {
      return {
        failure: true,
        reason: Object.keys(invalidL1Priority)[4],
      }
    }

    if(invalidL2Priority){
      return {
        failure: true,
        reason: Object.keys(invalidL2Priority)[5],
      }
    }
    return {
      failure: false
    }
  }
  
  const readVbpBulkUpdateCsv = data => {
    const tier1Price = data[8];
    const tier2Price = data[10];
    const tier3Price = data[12];
    const tier4Price = data[14];
    const tier1QuantityTo = data[9];
    const tier2QuantityTo = data[11];
    const tier3QuantityTo = data[13];

    const volumeBasedPrices = [
      ...(tier1Price !== "" && tier1QuantityTo !== ""
        ? [
          {
            price: parseFloat(tier1Price),
            quantityFrom: 1,
            quantityTo: parseInt(tier1QuantityTo),
          },
        ]
        : []),
      ...(tier2Price !== ""
        ? parseFloat(tier2Price) < parseFloat(tier1Price)
          ? tier2QuantityTo !== ""
            ? [
              {
                price: parseFloat(tier2Price),
                quantityFrom: parseInt(tier1QuantityTo) + 1,
                quantityTo: parseInt(tier2QuantityTo),
              },
            ]
            : [
              {
                price: parseFloat(tier2Price),
                quantityFrom: parseInt(tier1QuantityTo) + 1,
              },
            ]
          : [{}]
        : []),
      ...(tier3Price !== ""
        ? parseFloat(tier3Price) < parseFloat(tier2Price) && parseFloat(tier3Price) < parseFloat(tier1Price)
          ? tier3QuantityTo !== ""
            ? [
              {
                price: parseFloat(tier3Price),
                quantityFrom: parseInt(tier2QuantityTo) + 1,
                quantityTo: parseInt(tier3QuantityTo),
              },
            ]
            : [
              {
                price: parseFloat(tier3Price),
                quantityFrom: parseInt(tier2QuantityTo) + 1,
              },
            ]
          : [{}]
        : []),
      ...(tier4Price !== ""
        ? parseFloat(tier4Price) < parseFloat(tier3Price) && parseFloat(tier4Price) < parseFloat(tier2Price)
        && parseFloat(tier4Price) < parseFloat(tier1Price)
          ? [
            {
              price: parseFloat(tier4Price),
              quantityFrom: parseInt(tier3QuantityTo) + 1,
            },
          ]
          : [{}]
        : []),
    ];
    
    return volumeBasedPrices;
  };


module.exports= {
    readCSV,
    convertCsvBufferToJson,
    validateMissingPriorityData,
    validatePriorityDataIds, 
    countInArray,
    getS3Url,
    validatePriorities,
    readVbpBulkUpdateCsv,
}