// Google Apps Script for Vehicle Entry Registration System
// 이 스크립트를 Google Apps Script 에디터에 붙여넣고 배포하세요

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'addVehicle') {
      return addVehicleToSheet(data.data);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Unknown action'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addVehicleToSheet(vehicle) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('차량등록');

    // 시트가 없으면 생성
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('차량등록');

      // 헤더 추가
      newSheet.appendRow([
        '등록일시',
        '등록자',
        '입차날짜',
        '거래처명',
        '주문번호',
        '헤드번호',
        '트레일러번호',
        '운전자명',
        '운전자여권',
        '운전자전화',
        '입차예정시각',
        '입차완료여부'
      ]);

      // 헤더 스타일 지정
      const headerRange = newSheet.getRange(1, 1, 1, 12);
      headerRange.setBackground('#ED1C24');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }

    const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('차량등록');

    // 데이터 추가
    targetSheet.appendRow([
      new Date(vehicle.registeredAt).toLocaleString('ko-KR'),
      vehicle.registeredBy,
      vehicle.entryDate,
      vehicle.clientName,
      vehicle.orderNumber,
      vehicle.headNumber,
      vehicle.trailerNumber,
      vehicle.driverName,
      vehicle.driverPassport,
      vehicle.driverPhone,
      vehicle.entryTime,
      vehicle.entryCompleted ? '완료' : '대기'
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Vehicle registered successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'Vehicle Entry Registration API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}
