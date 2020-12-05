import json
import boto3

def lambda_handler(event, context):
    
    print(event)
    s3 = boto3.client('s3')
    client=boto3.client('rekognition')
    bucket = 'face-watch'
    faces = []
    
    # TODO
    # Read object key
    key = event['Records'][0]['s3']['object']['key']
    collection_id = key.split('/')[0]
    # Replace extension with json for key file
    filenameJson = key.split('.')[0] + '.json'
    print(filenameJson)
    
    # Read faceId from json file
    jsonObj = s3.get_object(Bucket=bucket, Key=filenameJson)
    
    jsonFileReader = jsonObj['Body'].read()
    jsonDict = json.loads(jsonFileReader)
    
    # Loop through faces and append to faces array
    for face in jsonDict["FaceRecords"]:
      faces.append(face["Face"]["FaceId"])
      
    # Delete faces
    response=client.delete_faces(CollectionId=collection_id, FaceIds=faces)
    
    if len(response['DeletedFaces']) > 0:
        print(response['DeletedFaces'])
        # Delete json file
        deleteJson = s3.delete_object(Bucket=bucket, Key=filenameJson)
        if deleteJson:
            print('File delete successfully')
            return {
                'statusCode': 200,
                'body': json.dumps('OK'),
            }
            
    return {
        'statusCode': 400,
        'body': json.dumps('Faces could not bet deleted!'),
    }
