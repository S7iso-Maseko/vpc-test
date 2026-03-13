# CodeBuild VPC with NAT Gateway Demo

This demo project tests CodeBuild running in a VPC with NAT Gateway connectivity.

## What This Tests

1. ✅ Install dependencies (npm install)
2. ✅ Run tests (npm test)
3. ✅ Internet connectivity via NAT Gateway (curl https://aws.amazon.com)
4. ✅ Upload artifact to S3 bucket

## Files

- `index.js` - Simple Node.js application with basic functions
- `test.js` - Simple test file
- `package.json` - Node.js project configuration
- `buildspec.yml` - CodeBuild build specification

## Prerequisites

### 1. S3 Bucket for Artifacts

```bash
# Create S3 bucket
aws s3 mb s3://your-codebuild-artifacts-bucket

# Update buildspec.yml with your bucket name
# Replace YOUR-BUCKET-NAME with your actual bucket name
```

### 2. VPC with NAT Gateway

You need:
- VPC with public and private subnets
- NAT Gateway in public subnet
- Private subnet route table pointing to NAT Gateway
- RDS database in private subnet (for your integration tests)

### 3. CodeBuild Project Configuration

Create a CodeBuild project with:

**VPC Configuration:**
- VPC ID: Your VPC
- Subnets: Private subnets (same as RDS)
- Security Groups: Allow outbound traffic

**Service Role Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeDhcpOptions",
        "ec2:DescribeVpcs",
        "ec2:CreateNetworkInterfacePermission"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-codebuild-artifacts-bucket",
        "arn:aws:s3:::your-codebuild-artifacts-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

## Setup via AWS Console

### Step 1: Create CodeBuild Project

1. Go to CodeBuild → Create build project
2. **Project name**: `vpc-nat-demo`
3. **Source**: 
   - Provider: GitHub / CodeCommit / S3
   - Repository: Your repo with these files
4. **Environment**:
   - Image: Managed image
   - Operating system: Amazon Linux 2
   - Runtime: Standard
   - Image: aws/codebuild/amazonlinux2-x86_64-standard:5.0
5. **VPC**:
   - ✅ Enable VPC
   - VPC: Select your VPC
   - Subnets: Select private subnets
   - Security groups: Select security group with outbound access
6. **Buildspec**: Use a buildspec file (buildspec.yml)
7. **Artifacts**: No artifacts (we're uploading to S3 manually)

### Step 2: Update buildspec.yml

Replace `YOUR-BUCKET-NAME` with your actual S3 bucket name.

### Step 3: Start Build

Click "Start build" and monitor the logs.

## Setup via CloudFormation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CodeBuild project in VPC with NAT Gateway

Parameters:
  VpcId:
    Type: AWS::EC2::VPC::Id
  
  PrivateSubnetIds:
    Type: List<AWS::EC2::Subnet::Id>
  
  SecurityGroupId:
    Type: AWS::EC2::SecurityGroup::Id
  
  ArtifactBucket:
    Type: String
    Description: S3 bucket for build artifacts

Resources:
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess
      Policies:
        - PolicyName: VPCAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:CreateNetworkInterface
                  - ec2:DescribeNetworkInterfaces
                  - ec2:DeleteNetworkInterface
                  - ec2:DescribeSubnets
                  - ec2:DescribeSecurityGroups
                  - ec2:DescribeDhcpOptions
                  - ec2:DescribeVpcs
                  - ec2:CreateNetworkInterfacePermission
                Resource: '*'
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - !Sub 'arn:aws:s3:::${ArtifactBucket}'
                  - !Sub 'arn:aws:s3:::${ArtifactBucket}/*'
        - PolicyName: LogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  CodeBuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: vpc-nat-demo
      ServiceRole: !GetAtt CodeBuildServiceRole.Arn
      Artifacts:
        Type: NO_ARTIFACTS
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:5.0
      Source:
        Type: GITHUB
        Location: https://github.com/your-username/your-repo.git
        BuildSpec: buildspec.yml
      VpcConfig:
        VpcId: !Ref VpcId
        Subnets: !Ref PrivateSubnetIds
        SecurityGroupIds:
          - !Ref SecurityGroupId

Outputs:
  ProjectName:
    Value: !Ref CodeBuildProject
```

## Expected Build Output

When you run the build, you should see:

```
[Container] Installing dependencies...
[Container] Dependencies installed successfully
[Container] Running tests...
[Container] ✓ Test 1 passed: greet function works
[Container] ✓ Test 2 passed: add function works
[Container] All tests passed!
[Container] Tests completed successfully
[Container] Build started on Thu Mar 13 10:30:00 UTC 2026
[Container] Testing internet connectivity via NAT Gateway...
[Container] HTTP/1.1 200 OK
[Container] Internet connectivity confirmed!
[Container] Creating build artifact...
[Container] Build completed on Thu Mar 13 10:30:15 UTC 2026
[Container] Uploading artifact to S3...
[Container] upload: ./build-output.zip to s3://your-bucket/builds/build-output-20260313-103015.zip
[Container] Artifact uploaded successfully
```

## Troubleshooting

If the curl fails:
- Check NAT Gateway is in public subnet
- Verify private subnet route table has `0.0.0.0/0` → NAT Gateway
- Check security group allows outbound HTTPS (port 443)

If S3 upload fails:
- Verify CodeBuild service role has S3 permissions
- Check bucket name is correct in buildspec.yml
- Consider using S3 VPC endpoint (free, faster)

All files are ready in `CodeBuild/vpc-nat-demo/` - just update the bucket name in buildspec.yml and push to your repo!