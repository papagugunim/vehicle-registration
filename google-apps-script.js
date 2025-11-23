// Google Apps Script for Vehicle Entry Registration System
// 이 스크립트를 Google Apps Script 에디터에 붙여넣고 배포하세요

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // 차량 관리
    if (action === 'addVehicle') {
      return addVehicleToSheet(data.data);
    }

    // 거래처 관리
    if (action === 'getClients') {
      return getClients();
    }
    if (action === 'addClient') {
      return addClient(data.data);
    }
    if (action === 'updateClient') {
      return updateClient(data.data);
    }
    if (action === 'deleteClient') {
      return deleteClient(data.id);
    }
    if (action === 'importCsvClients') {
      return importCsvClients(data.clients);
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

// ========== 거래처 관리 API ==========

// 거래처 목록 조회
function getClients() {
  try {
    const sheet = getOrCreateClientSheet();
    const data = sheet.getDataRange().getValues();

    // 헤더 제외하고 데이터만 반환
    const clients = [];
    for (let i = 1; i < data.length; i++) {
      clients.push({
        id: data[i][0],
        accountNumber: data[i][1],
        clientName: data[i][2],
        segment: data[i][3],
        salesRegion: data[i][4],
        createdAt: data[i][5],
        updatedAt: data[i][6]
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: clients
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 거래처 추가
function addClient(client) {
  try {
    const sheet = getOrCreateClientSheet();
    const id = new Date().getTime(); // 타임스탬프를 ID로 사용
    const now = new Date().toISOString();

    sheet.appendRow([
      id,
      client.accountNumber,
      client.clientName,
      client.segment,
      client.salesRegion,
      now,
      now
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Client added successfully',
      id: id
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 거래처 수정
function updateClient(client) {
  try {
    const sheet = getOrCreateClientSheet();
    const data = sheet.getDataRange().getValues();

    // ID로 행 찾기
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == client.id) {
        const now = new Date().toISOString();
        sheet.getRange(i + 1, 1, 1, 7).setValues([[
          client.id,
          client.accountNumber,
          client.clientName,
          client.segment,
          client.salesRegion,
          data[i][5], // createdAt 유지
          now // updatedAt 갱신
        ]]);

        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Client updated successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Client not found'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 거래처 삭제
function deleteClient(id) {
  try {
    const sheet = getOrCreateClientSheet();
    const data = sheet.getDataRange().getValues();

    // ID로 행 찾기
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);

        return ContentService.createTextOutput(JSON.stringify({
          status: 'success',
          message: 'Client deleted successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Client not found'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// CSV 일괄 업로드
function importCsvClients(clients) {
  try {
    const sheet = getOrCreateClientSheet();
    const now = new Date().toISOString();

    // 배치로 데이터 추가
    const rows = clients.map(client => {
      const id = new Date().getTime() + Math.random(); // 고유 ID 생성
      return [
        id,
        client.accountNumber,
        client.clientName,
        client.segment,
        client.salesRegion,
        now,
        now
      ];
    });

    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: `${clients.length} clients imported successfully`
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 거래처 시트 가져오기 또는 생성
function getOrCreateClientSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('거래처정보');

  if (!sheet) {
    sheet = ss.insertSheet('거래처정보');

    // 헤더 추가
    sheet.appendRow([
      'ID',
      '계정번호',
      '거래처명',
      '세그먼트',
      '판매지역',
      '등록일시',
      '수정일시'
    ]);

    // 헤더 스타일 지정
    const headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setBackground('#ED1C24');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 열 너비 조정
    sheet.setColumnWidth(1, 120); // ID
    sheet.setColumnWidth(2, 100); // 계정번호
    sheet.setColumnWidth(3, 250); // 거래처명
    sheet.setColumnWidth(4, 100); // 세그먼트
    sheet.setColumnWidth(5, 120); // 판매지역
    sheet.setColumnWidth(6, 150); // 등록일시
    sheet.setColumnWidth(7, 150); // 수정일시
  }

  return sheet;
}
