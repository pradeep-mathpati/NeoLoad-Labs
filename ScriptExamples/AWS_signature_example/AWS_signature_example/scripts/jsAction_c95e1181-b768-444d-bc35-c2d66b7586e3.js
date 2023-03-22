function sign(key, msg) {
    return CryptoJS.HmacSHA256(key, msg);
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    var kDate = sign(dateStamp, 'AWS4' + key);
    var kRegion = sign(regionName, kDate);
    var kService = sign(serviceName, kRegion);
    var kSigning = sign('aws4_request', kService);

    return kSigning;
}

// ************* REQUEST VALUES *************
var method = 'GET';
var service = 'execute-api';
var host = 'sqs.eu-west-1.amazonaws.com';
var region = 'eu-west-1';
var request_parameters = 'accept:application/json';

//var access_key = context.variableManager.getValue("Key.Access");
var access_key = context.variableManager.getValue("v_AccessKeyId");
//var secret_key = context.variableManager.getValue("Key.Secret");
var secret_key = context.variableManager.getValue("v_secretkey");
var amzdate = context.variableManager.getValue("CurrentDate_AMZ");
//var amzdate ="20180823T"+ context.variableManager.getValue("GMTexptime ")+"Z"   ;
context.variableManager.setValue("constdate", amzdate);
logger.debug(amzdate );

var datestamp = context.variableManager.getValue("CurrentDate");

// ************* TASK 1: CREATE A CANONICAL REQUEST *************
var canonical_uri = '/release/venues/list';
var canonical_querystring = request_parameters;
var canonical_headers = 'host:' + host + '\n' + 'x-amz-date:' + amzdate + '\n';
var signed_headers = 'accept;host;x-amz-date';
var payload_hash = CryptoJS.SHA256('');

var canonical_request = method + '\n' + canonical_uri + '\n\n' + canonical_querystring + '\n' + canonical_headers + '\n' + signed_headers + '\n' + payload_hash;
logger.debug("Canonical Request="+canonical_request);


context.variableManager.setValue("canonicalrequest",canonical_request );
// ************* TASK 2: CREATE THE STRING TO SIGN*************
var algorithm = 'AWS4-HMAC-SHA256';
var credential_scope = datestamp + '/' + region + '/' + service + '/' + 'aws4_request';
var string_to_sign = algorithm + '\n' +  amzdate + '\n' +  credential_scope + '\n' + CryptoJS.SHA256(canonical_request);
logger.debug("String To Sign="+string_to_sign);

// ************* TASK 3: CALCULATE THE SIGNATURE *************
var signing_key = getSignatureKey(secret_key, datestamp, region, service);
var signature = sign(string_to_sign,signing_key);

// ************* TASK 4: ADD SIGNING INFORMATION TO THE REQUEST *************
//Authorization: AWS4-HMAC-SHA256 Credential=ASIA2YNHP73OF4OCNHGC/20180817/eu-central-1/execute-api/aws4_request, SignedHeaders=accept;host;x-amz-date, Signature=c364514bf108502e3cc28bbf564a0ec6204fb0087d5e2612ff37c22da01fdd6d
var authorization_header = algorithm + ' ' + 'Credential=' + access_key + '/' + credential_scope + ', ' +  'SignedHeaders=' + signed_headers + ', ' + 'Signature=' + signature;
logger.debug("Authorization complet="+authorization_header);

context.variableManager.setValue("v_Auth_Header",authorization_header);