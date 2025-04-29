import base64
from io import BytesIO
import json
import random
import smtplib
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import jwt
import datetime
import psycopg2
from werkzeug.utils import secure_filename
import os
from passlib.context import CryptContext
import re
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flask_jwt_extended import JWTManager, create_access_token
from datetime import timedelta
from google import genai
import fitz
# PyMuPDF
app = Flask(__name__)
CORS(app)

# Your secret key for encoding and decoding the JWT token
app.config['JWT_SECRET_KEY'] = 'your_secret_key_here'

# Optionally, specify where the token will be stored (default is Authorization header)
app.config['JWT_TOKEN_LOCATION'] = ['headers']  # You can add 'cookies' if using cookies to store the token

# Initialize JWT manager
jwt = JWTManager(app)
# Configurations
UPLOAD_FOLDER = 'uploads/profile_pics'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/todo"

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def create_data_table():
    conn = get_db_connection()
    cur = conn.cursor()    
    
    
# Create table if it doesn't exist
    create_table_query="""
    CREATE TABLE IF NOT EXISTS data (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE ,
        profile_pic BYTEA, -- to store profile picture as binary data
        resume BYTEA -- to store resume as binary data
    );
    """
    
    cur.execute(create_table_query)
    conn.commit()

    create_table_query="""
    CREATE TABLE IF NOT EXISTS job_location (
        id SERIAL PRIMARY KEY,
        location VARCHAR(100) UNIQUE  
    );
    """
    
    cur.execute(create_table_query)
    conn.commit()

    cur.close()
    conn.close()


def create_users_table():
    conn = get_db_connection()
    cur = conn.cursor()    
    
    
# Create table if it doesn't exist
    create_table_query="""
    CREATE TABLE IF NOT EXISTS user_candidate (
        username VARCHAR(100) UNIQUE NOT NULL PRIMARY KEY ,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        data_id INTEGER, 
        f_name VARCHAR(100) NOT NULL,
        l_name VARCHAR(100) NOT NULL,
        
        CONSTRAINT fk_data FOREIGN KEY (data_id) REFERENCES data(id) ON DELETE CASCADE
    );
    """
    
    cur.execute(create_table_query)
    conn.commit()
    

    create_table_query="""
    CREATE TABLE IF NOT EXISTS user_hr (
        username VARCHAR(100) UNIQUE NOT NULL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        Org VARCHAR(50) ,
        data_id INTEGER, 
        f_name VARCHAR(100) NOT NULL,
        l_name VARCHAR(100) NOT NULL,

        CONSTRAINT fk_data FOREIGN KEY (data_id) REFERENCES data(id) ON DELETE CASCADE
    );
    """

    cur.execute(create_table_query)
    conn.commit()
    cur.close()
    conn.close()

def create_jobs_table():
    conn = get_db_connection()
    cur = conn.cursor()    
    
    create_table_query = """
    CREATE TABLE IF NOT EXISTS job_posts (
        id SERIAL PRIMARY KEY,
        hr_username VARCHAR(50) NOT NULL,
        job_title TEXT NOT NULL,
        job_description TEXT NOT NULL,
        Org VARCHAR(50),
        location_id INTEGER, 
        required_exp VARCHAR(50),

        CONSTRAINT fk_hr FOREIGN KEY (hr_username) REFERENCES user_hr(username) ON DELETE CASCADE,
        CONSTRAINT fk_data FOREIGN KEY (location_id) REFERENCES job_location(id) ON DELETE CASCADE
    );
    """
   
    cur.execute(create_table_query)
    conn.commit()
    
    create_table_query="""
    CREATE TABLE IF NOT EXISTS jobs_candidate_applied (
        id SERIAL PRIMARY KEY,
        candidate_username VARCHAR(100) NOT NULL,
        hr_username VARCHAR(255) NOT NULL,
        job_id INTEGER, 
        candidate_resume BYTEA,-- to store resume as binary data
        status VARCHAR(25),
        
         -- Foreign key constraints
        CONSTRAINT fk_candidate FOREIGN KEY (candidate_username) REFERENCES user_candidate(username) ON DELETE CASCADE,
        CONSTRAINT fk_hr FOREIGN KEY (hr_username) REFERENCES user_hr(username) ON DELETE CASCADE,
        CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES job_posts(id) ON DELETE CASCADE
   
    );
    """
    
    cur.execute(create_table_query)
    conn.commit()
    cur.close()
    conn.close()

def create_info_table():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create table query
   
    # Create table query
    create_table_query = """
    CREATE TABLE IF NOT EXISTS candidate_info (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        skills TEXT,
        experience TEXT,
        project TEXT,
        education Text,
        data_id INTEGER,
        match_score REAL,
        ats_score REAL,
        email VARCHAR(255),
        CONSTRAINT fk_data FOREIGN KEY (data_id) REFERENCES data(id) ON DELETE CASCADE,
        CONSTRAINT fk_candidate FOREIGN KEY (username) REFERENCES user_candidate(username) ON DELETE CASCADE
    );
    """
    
    cur.execute(create_table_query)
    conn.commit()
    cur.close()
    conn.close()


@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    conn = get_db_connection()
    cur = conn.cursor() 
    data = request.json
    email = data['email']
    role = data['role']
    database = "user_candidate"
    # Hash the password for security
    if role=="candidate":
        database = 'user_candidate'
    elif role=="HR":
        database = 'user_hr'
    query = f"SELECT email, role FROM {database} WHERE email = %s"
    cur.execute(query, (email,))  
    user = cur.fetchone()
    if user:
            conn.rollback()
            return jsonify({"message": "Email already registered"}), 400
    # Send OTP via email
    sender_email = "bagwannihal4@gmail.com"
    sender_password = "dcoa nenk ycog ckbq"
    otp = str(random.randint(100000, 999999))
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.starttls()
            smtp.login(sender_email, sender_password)
            message = f'Subject: Your OTP\n\nYour OTP for registration is: {otp}'
            smtp.sendmail(sender_email, email, message)
    except Exception as e:
        print(e)
        return jsonify({"message": "Failed to send email"}), 500

    return jsonify({"otp": otp})


@app.route('/api/register', methods=['POST'])
def register():
    conn = get_db_connection()
    cur = conn.cursor() 
    data = request.json
    username = data['username']
    email = data['email']
    password = data['password']
    role = data['role']
    database = "user_candidate"
    org = data['org']
    f_name = data['fname']
    l_name = data['lname']
    # Hash the password for security
    if role=="candidate":
        database = "user_candidate"
    elif role=="hr":
        database = "user_hr"
        
    hashed_password =  pwd_context.hash(password)
    query = f"SELECT email, role FROM {database} WHERE email = %s"
    cur.execute(query, (email,))  
    user = cur.fetchone()
   
    try:
         
        if user:
            conn.rollback()
            return jsonify({"message": "Email already registered"}), 400
        else:
            if role=="candidate":
                query = f"INSERT INTO {database} (username, email, password, role, f_name, l_name) VALUES (%s, %s, %s, %s, %s, %s)"
                cur.execute(query, (username, email, hashed_password, role, f_name, l_name))    
            elif role=="hr":
                query = f"INSERT INTO {database} (username, email, password, role, org, f_name, l_name) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cur.execute(query, (username, email, hashed_password, role, org, f_name, l_name))    
            conn.commit()
        return jsonify({"message": "User registered successfully"})
    except psycopg2.IntegrityError:
        conn.rollback()
        return jsonify({"message": "Email already registered"}), 400
    except Exception as e:
        conn.rollback()
        print(e)
        return jsonify({"message": "Registration failed"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
import re

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None
def getUserTableQuery(database, email):
    if is_valid_email(email):
        query = f"SELECT  username, email, password, role, f_name, l_name FROM {database} WHERE email = %s"
    else:
        query = f"SELECT  username, email, password, role, f_name, l_name FROM {database} WHERE username = %s"
    return query

@app.route('/api/login', methods=['POST'])
def login():
    conn = get_db_connection()
    cur = conn.cursor() 
    data = request.json
    username = data['username']
    password = data['password']
    database = "user_candidate"
    query = getUserTableQuery(database,username)
    
    try:
        cur.execute(query, (username,))  
        user = cur.fetchone()
        if user is None:
            query = getUserTableQuery("user_hr",username)
            cur.execute(query, (username,))  
            user = cur.fetchone()
        
        if user:
            username, email, hashed_password, role, f_name, l_name = user

            # Check if password matches
            # 
            if pwd_context.verify(password, hashed_password):
                # Password is correct, generate JWT
                token = create_access_token(identity=username, additional_claims={'role': role, 'email':email}, expires_delta=timedelta(hours=12))


                return jsonify({
                    "token": token,
                    "username": username,
                    "role": role,
                    "f_name": f_name,
                    "l_name":l_name
                })
            else:
                return jsonify({"message": "Invalid credentials"}), 401
        else:
            return jsonify({"message": "Invalid credentials"}), 401

    except Exception as e:
        print(e)
        return jsonify({"message": "Something went wrong"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/api/update-profile-pic', methods=['POST'])
@jwt_required()
def upload_profile_pic():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor() 
    user_id = current_user # Get user_id from the JWT payload
    try:
        if 'profile_pic' not in request.files:
            return jsonify({"error": "Profile picture is required"}), 400

        file = request.files['profile_pic']

         # Read the profile picture and resume as binary data
        
        allowed_extensions = {'jpg', 'jpeg', 'png'}
        if not '.' in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
            return jsonify({"error": "Invalid file type. Only PNG, JPG, JPEG, and GIF are allowed"}), 400

        profile_pic_data = file.read()
        if not profile_pic_data:
            return jsonify({"error": "File is empty"}), 400
    # Save binary data to database
    
        cur.execute("UPDATE data SET profile_pic = %s WHERE username = %s", 
                (psycopg2.Binary(profile_pic_data), user_id))
        conn.commit()

        return jsonify({"message": "Profile uploaded successfully!"})
    except Exception as e:
        print(e)
        return jsonify({"message": f"Error: {str(e)}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# Route to fetch user details
@app.route('/api/get-user', methods=['GET'])
@jwt_required()
def get_user():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor() 
    user_id = current_user # Get user_id from the JWT payload
    additional_claims = get_jwt()  # This will get the additional claims (like 'role')
    role = additional_claims.get('role') 
    if role=="candidate":
        database = "user_candidate"
        query = f"SELECT  username, email, password, role, data_id, f_name, l_name FROM {database} WHERE username = %s"
    elif role=="hr":
        database = "user_hr"
        query = f"SELECT  username, email, password, role, org, data_id, f_name, l_name FROM {database} WHERE username = %s"

    cur.execute(query, (user_id,))  
    user = cur.fetchone()
    print(user)
    
    try:
        if role=="candidate":
            username, email, hashed_password, role, data_id, f_name, l_name= user
        elif role=="hr":
            username, email, hashed_password, role, org, data_id, f_name, l_name = user
        
        if user:
            user_info = {
                "username": username,
                "email": email,
                "role": role,
                "f_name" : f_name,
                "l_name" : l_name,
                "data_id": data_id,
            }
            if role=="candidate":
                if data_id is None:
                    query = f"INSERT INTO data (username) VALUES (%s) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username"
                    cur.execute(query, (username,))  
                    conn.commit()
                    query = f"select id from data where username = %s"
                    cur.execute(query, (username,))  
                    data_id = cur.fetchone()
                    query = f"INSERT INTO candidate_info (username, email, data_id) VALUES (%s, %s, %s) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username, email = EXCLUDED.email, data_id=EXCLUDED.data_id"
                    cur.execute(query, (username, email, data_id ))
                    conn.commit()
                    query = f"UPDATE user_candidate SET data_id = %s WHERE username = %s"
                    cur.execute(query, (data_id, username ))
                    conn.commit()
                else:
                    query = f"SELECT username, profile_pic, resume FROM data WHERE username = %s"
                    cur.execute(query, (username,))  
                    data = cur.fetchone()
                    username, profile_picture, resume, = data
                    # Convert binary data to base64 for JSON response
                    if profile_picture:
                        base64_string = base64.b64encode(profile_picture).decode('utf-8')
                        # Create data URI for the frontend
                        user_info["profilePictureUrl"] = f"data:image/jpeg;base64,{base64_string}"
                    if resume:
                        base64_string = base64.b64encode(resume).decode('utf-8')
                        # Create data URI for the frontend
                        user_info["resume"] = f"data:application/pdf;base64,{base64_string}"

                cur.execute("select education , experience , skills from candidate_info where username = %s",(current_user,))
                data = cur.fetchone()
                if data:
                    education , experience , skills = data
                    user_info["education"]  = education
                    user_info["experience"]  = experience
                    user_info["skills"]  = skills

                return jsonify(user_info)
            elif role=="hr":
                user_info['organization'] = org
                if data_id  is None:
                    query = f"INSERT INTO data (username) VALUES (%s) ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username"
                    cur.execute(query, (username,))  
                    conn.commit()
                    query = f"select id from data where username = %s"
                    cur.execute(query, (username,))  
                    data = cur.fetchone()[0]
                    data_id = data
                    query = f"UPDATE user_hr SET data_id = %s WHERE username = %s"
                    cur.execute(query, (data_id, username ))
                    conn.commit()
                else:
                    query = f"SELECT username, profile_pic, resume FROM data WHERE username = %s"
                    cur.execute(query, (username,))  
                    data = cur.fetchone()
                    print(data)
                    username, profile_picture, resume, = data
                    # Convert binary data to base64 for JSON response
                    if profile_picture:
                        base64_string = base64.b64encode(profile_picture).decode('utf-8')
                        # Create data URI for the frontend
                        user_info["profilePictureUrl"] = f"data:image/jpeg;base64,{base64_string}"
            
                return jsonify(user_info)
        else:
            return jsonify({"message": "User not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching user"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/get-locations', methods=['GET'])
def get_locations():
    conn = get_db_connection()
    cur = conn.cursor() 
    try:
        query = f"SELECT  * FROM job_location"
        cur.execute(query)  
        location = cur.fetchall()
        location_dict = {str(location[0]): location[1] for location in location}
        return jsonify(location_dict), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching locations"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/public/jobs', methods=['GET'])
def get_all_jobs_public():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    offset = (page - 1) * limit

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT j.id, j.hr_username, u.f_name, u.l_name, j.job_title, j.job_description, j.org, j.location_id, j.required_exp
        FROM job_posts j
        JOIN user_hr u ON j.hr_username = u.username
        ORDER BY j.id DESC
        LIMIT %s OFFSET %s
    """, (limit, offset))
    rows = cur.fetchall()

    jobs = []
    for row in rows:
        jobs.append({
            'id': row[0],
            'hr_username': row[1],
            'f_name': row[2],
            'l_name': row[3],
            'job_title': row[4],
            'job_description': row[5],
            'org': row[6],
            'location_id': row[7],
            'required_exp': row[8]
        })

    cur.close()
    conn.close()
    return jsonify({'jobs': jobs})

@app.route('/api/get-jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor() 
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page
    try:
        query = """SELECT 
                j.id, j.hr_username, u.f_name, u.l_name, j.job_title, j.job_description, j.org, j.location_id, j.required_exp
                FROM job_posts j
                JOIN user_hr u ON j.hr_username = u.username
                WHERE j.id NOT IN (
                    SELECT job_id 
                    FROM jobs_Candidate_applied 
                    WHERE candidate_username = %s
                )
                LIMIT %s OFFSET %s;"""
        cur.execute(query,(current_user,per_page, offset))
        rows = cur.fetchall()
        # Format it properly
        jobs = []
        for row in rows:
            job = {
                "id": row[0],
                "hr_username": row[1],
                "f_name" : row[2],
                "l_name" : row[3],
                "job_title": row[4],
                "job_description": row[5],
                "org": row[6],
                "location_id": row[7],
                "required_exp": row[8]
            }       
            jobs.append(job)
        return jsonify({"jobs": jobs}), 200
    except Exception as e:
        print(e)
        return jsonify({"message": "Error fetching jobs"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/get-profile-pic', methods=['GET'])
@jwt_required()
def get_profile_pic():
    current_user = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor() 
    user_id = current_user # Get user_id from the JWT payload
    additional_claims = get_jwt()  # This will get the additional claims (like 'role')
    role = additional_claims.get('role') 

    if role=="candidate":
        database = "user_candidate"
        query = f"SELECT  username, email, password, role, data_id FROM {database} WHERE username = %s"
    elif role=="hr":
        database = "user_hr"
        query = f"SELECT  username, email, password, role, org, data_id FROM {database} WHERE username = %s"

    cur.execute(query, (user_id,))  
    user = cur.fetchone()
    cur.execute("SELECT profile_pic FROM users WHERE id = %s", (user_id,))
    profile_pic_data = cur.fetchone()

    if profile_pic_data is None:
        return jsonify({"error": "Profile picture not found"}), 404

    cur.close()
    conn.close()

    return send_file(BytesIO(profile_pic_data[0]), mimetype='image/jpeg')

# Endpoint to get resume (protected route)
@app.route('/api/get-resume', methods=['GET'])
def get_resume():
    token = request.headers.get('Authorization', "").split(" ")[1]  # Extract token from Authorization header
    payload = verify_token(token)
    if not payload:
        return jsonify({"error": "Unauthorized"}), 401  # Return Unauthorized if token is invalid or expired

    user_id = payload['username']  # Get user_id from the JWT payload

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT resume FROM users WHERE id = %s", (user_id,))
    resume_data = cur.fetchone()

    if resume_data is None:
        return jsonify({"error": "Resume not found"}), 404

    cur.close()
    conn.close()

    return send_file(BytesIO(resume_data[0]), mimetype='application/pdf')


@app.route('/api/analyze-job-matching', methods=['POST'])
def analyze_job_matching():
    token = request.headers.get('Authorization', "").split(" ")[1]
    try:
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except:
        return jsonify({"message": "Unauthorized"}), 401

    # Extract resume and job description from the request
    if 'resume' in request.files:
            resume_file = request.files['resume']
            # Read resume as binary data
            resume_data = resume_file.read()
            if not resume_data:
                return jsonify({"error": "Resume file is empty"}), 400
    resume_file = request.files.get('resume')
    job_description = request.form.get('jobDescription')

    if not resume_file or not job_description:
        return jsonify({"message": "Missing resume or job description"}), 400

    # Analyze the resume against the job description
    resume_text = analyze_resume(resume_file, job_description)

    # Extract the analysis data
    match_score = resume_text.get('matchScore', 0)

    return jsonify({"message": "Resume analysis complete and data saved",data:resume_text})

@app.route('/api/find-matching-candidates', methods=['POST'])
def find_matching_candidates():
    token = request.headers.get('Authorization', "").split(" ")[1]
    try:
        jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
    except:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json
    jd_text = data.get('jobDescription', "")
    jd_keywords = set(jd_text.lower().split())

    matching = []
    

    matching = sorted(matching, key=lambda x: x["matchScore"], reverse=True)

    return jsonify({"candidates": matching})


@app.route('/api/update-candidate-profile', methods=['POST'])
@jwt_required()
def update_candidate_profile():
    current_user = get_jwt_identity()  # Get username from JWT
    conn = get_db_connection()
    cur = conn.cursor()
    user_id = current_user # Get user_id from the JWT payload
    resume_text = {}
    try:
        
        if 'resume' in request.files:
            resume_file = request.files['resume']
            # Read resume as binary data
            resume_data = resume_file.read()
            allowed_extensions = {'pdf', 'docx'}
            if not '.' in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                return jsonify({"error": "Invalid file type. Only pdf and docx are allowed"}), 400
            
            if not resume_data:
                return jsonify({"error": "Resume file is empty"}), 400
            resume_file.seek(0)
            cur.execute("UPDATE data SET resume = %s WHERE username = %s", 
                (psycopg2.Binary(resume_data), user_id))
        conn.commit()
        query = f"select id from data where username = %s"
        cur.execute(query, (user_id,))  
        data = cur.fetchone()[0]
        data_id = data
        # Extract form data
        education_list = request.form['educationList']  # JSON string
        experience_list = request.form['experienceList']  # JSON string
        skills = request.form['skills']  # JSON string
        '''
        resume_text = analyze_resume(resume_file, None)
        # Extract the analysis data
        match_score = resume_text.get('ats_score', 0)
        cur.execute("select education , experience , skills from candidate_info where username = %s",(current_user,))
        data = cur.fetchone()
        if data:
            education , experience , skills = data
            if education is None or education.strip() == '' or len(json.loads(education)) == 0:
                if not education_list or education_list.strip() == '' or education_list is None or len(json.loads(education_list)) == 0:
                    education_list = resume_text.get('education')
            if skills is None or skills.strip() == '' or len(json.loads(skills)) == 0:
                if not skills or skills.strip() == '' or skills is None or len(json.loads(skills)) == 0:
                    skills = resume_text.get('skills')
            if experience is None or experience.strip() == '' or len(json.loads(experience)) == 0:
                if not experience_list or experience_list.strip() == '' or experience_list is None or len(json.loads(experience_list)) == 0:
                    experience_list = resume_text.get('experience')
        # Update or insert candidate profile
        print(resume_text)  '''
        cur.execute("""
            INSERT INTO candidate_info (username, education , experience , skills , data_id)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username)
            DO UPDATE SET
                education = EXCLUDED.education,
                experience = EXCLUDED.experience,
                skills = EXCLUDED.skills,
                data_id = EXCLUDED.data_id
                
        """, (
            current_user,
            education_list,
            experience_list,
            skills,
            data_id
        ))

        conn.commit()
        return jsonify({"message": "Profile updated successfully!"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Error updating profile"}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/post-job', methods=['POST'])
@jwt_required()
def post_job():
    current_user = get_jwt_identity()  # Get username from JWT
    conn = get_db_connection()
    cur = conn.cursor()
    data = request.json
    try:

        # Create new Job entry
        organization=data['organization'],
        job_title=data['jobTitle'],
        job_description=data['jobDescription'],
        location=data['selectedLocation']
        required_exp = data['selectedExperience']
       

        cur.execute("""
            INSERT INTO job_posts ( hr_username,  job_title ,  job_description , Org, location_id, required_exp)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (
            current_user,
            job_title,
            job_description,
            organization,
            location,
            required_exp
        ))

        conn.commit()

        # Add and commit to the database
        return jsonify({"message": "Job posted successfully!"}), 201

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error posting job"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route('/api/apply-job', methods=['POST'])
@jwt_required()
def apply_job():
    current_user = get_jwt_identity()  # Get username from JWT
    conn = get_db_connection()
    cur = conn.cursor()
    try:

        # Create new Job entry
        username=current_user,
        hr_username=request.form['hrUsername'],
        job_id=request.form['jobID'],
        print(request.form)
        if 'resume' in request.files:
            resume_file = request.files['resume']
            # Read resume as binary data
            resume_data = resume_file.read()
            allowed_extensions = {'pdf', 'docx'}
            if not '.' in resume_file.filename or resume_file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
                return jsonify({"error": "Invalid file type. Only pdf and docx are allowed"}), 400
            
            if not resume_data:
                return jsonify({"error": "Resume file is empty"}), 400
            resume_file.seek(0)
            cur.execute("""
                INSERT INTO jobs_Candidate_applied ( hr_username,  candidate_username ,   job_id , candidate_resume, status)
                VALUES (%s, %s, %s, %s, %s)
            """, (
            hr_username,
            username,
            job_id,
            resume_data,
            "Pending"
            ))
            conn.commit()
            # Add and commit to the database
            return jsonify({"message": "Job posted successfully!"}), 201
        else :
            return jsonify({"message": "No Resume found"}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error posting job"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route("/api/candidate/applied-jobs", methods=["GET"])
@jwt_required()
def get_applied_jobs():
    username = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        print(per_page)
        offset = (page - 1) * per_page
        query = """
            SELECT 
            ja.id AS application_id,
            jp.id AS job_id,
            jp.job_title,
            jp.job_description,
            jp.org,
            ja.hr_username,
            u.f_name,
            u.l_name,
            ja.status,
            l.location as location
            FROM 
                jobs_Candidate_applied ja
            JOIN 
                job_posts jp ON ja.job_id = jp.id
            LEFT JOIN 
                job_location l On jp.location_id = l.id
            JOIN user_hr u ON jp.hr_username = u.username
            WHERE 
                ja.candidate_username = %s LIMIT %s OFFSET %s
        """
        cur.execute(query, (username,per_page,offset))
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        data = [dict(zip(columns, row)) for row in rows]
        return jsonify(data)
    except Exception as e:
        print(e)
        return jsonify({"error": "Error fetching applied jobs"}), 500
    finally :
        if cur:
            cur.close()
        if conn:
            conn.close()
    
@app.route('/api/get-posted-jobs', methods=['GET'])
@jwt_required()
def get_posted_jobs():
    username = get_jwt_identity()
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT id, job_title, job_description, org, location_id, required_exp
            FROM job_posts
            WHERE hr_username = %s
            ORDER BY id DESC
            LIMIT %s OFFSET %s
        """, (username, limit, offset))
        jobs = cur.fetchall()

        return jsonify({'jobs': [{
            'id': row[0],
            'job_title': row[1],
            'job_description': row[2],
            'org': row[3],
            'location_id': row[4],
            'required_exp': row[5]
            } for row in jobs]})
    except Exception as e:
        print(e)
        return jsonify({"error": "Error fetching jobs"}), 500
    finally :
        if cur:
            cur.close()
        if conn:
            conn.close()

# 2. Get candidates for a specific job
@app.route('/api/hr/job/<int:job_id>/applications', methods=['GET'])
@jwt_required()
def get_candidates_for_job(job_id):
    username = get_jwt_identity()
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT ja.id, ja.candidate_username, ja.status,  uc.f_name, uc.l_name
            FROM jobs_Candidate_applied ja
            JOIN user_candidate uc ON uc.username = ja.candidate_username
            WHERE ja.job_id = %s
        """, (job_id,))
        rows = cur.fetchall()

        candidates = []
        for row in rows:
            candidates.append({
            'application_id': row[0],
            'candidate_username': row[1],
            'status': row[2],
            'f_name':row[3],
            'l_name':row[4]
            
        })

        return jsonify(candidates)
    except Exception as e:
        print(e)
        return jsonify({"error": "Error fetching applications"}), 500
    finally :
        if cur:
            cur.close()
        if conn:
            conn.close()

# 3. View resume for a candidate
@app.route('/api/hr/view-resume/<int:application_id>', methods=['GET'])
@jwt_required()
def view_resume(application_id):
    username = get_jwt_identity()
    
    candidate_username = str(request.args.get('candidate_username', ''))
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT candidate_resume
            FROM jobs_Candidate_applied
            WHERE id = %s and candidate_username = %s
        """, (application_id, candidate_username))
        row = cur.fetchone()
       
        if not row or not row[0]:
            return jsonify({'error': 'Resume not found'}), 404

        # Update status to 'viewed'
        cur.execute("""
            UPDATE jobs_Candidate_applied SET status = 'viewed'
            WHERE id = %s and candidate_username = %s and status = 'pending'
        """, (application_id, candidate_username))
        conn.commit()
        if row[0]:
            return send_file(BytesIO(row[0]), download_name='resume.pdf', as_attachment=True)
        else:
            return jsonify({"error": "Error fetching Rresume or updating status"}), 500

    except Exception as e:
        f"Error: {str(e)}"
        return jsonify({"error": "Error fetching Rresume or updating status"}), 500
    finally :
        if cur:
            cur.close()
        if conn:
            conn.close()

# 4. Update status for a candidate
@app.route('/api/hr/update-status', methods=['PUT'])
@jwt_required()
def update_application_status():
    username = get_jwt_identity()
    data = request.json
    application_id = data.get('application_id')
    new_status = data.get('status')
    candidate_username = data.get('candidate_username')
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if not application_id or not new_status:
            return jsonify({'error': 'Missing data'}), 400

        
        cur.execute("""
            UPDATE jobs_Candidate_applied
            SET status = %s
            WHERE id = %s AND candidate_username = %s
        """, (new_status, application_id, candidate_username))
        conn.commit()
        return jsonify({'message': 'Status updated'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "Error while updating status"}), 500
    finally :
        if cur:
            cur.close()
        if conn:
            conn.close()


# 6. Upload resume and get analysis
@app.route('/api/analyze-resume', methods=['POST'])
@jwt_required()
def analyze_resume():
    username = get_jwt_identity()
    conn = get_db_connection()
    cur = conn.cursor()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    try:
        doc = fitz.open(stream=file.read(), filetype="pdf")
        resume_text = "\n".join([page.get_text() for page in doc])
        client = genai.Client(api_key="")
        response = client.models.generate_content(
            model="gemini-2.0-flash", contents = f"""
Analyze this resume and extract the following in JSON. Format of JSON is given below. 
Always provide response in this format only — do not change it:

{{
    "experience": [
        {{
            "title": "",
            "company": "",
            "location": "",
            "duration": "",
            "description": ["", "", "", "", "", "", "", "", "", ""]
        }}
    ],
    "education": [
        {{
            "degree": "",
            "university": "",
            "duration": ""
        }}
    ],
    "skills": {{
        "technical_skills": [
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
        ],
        "soft_skills": [
            "", "", "", "", ""
        ]
    }},
    "grammar_issues": [],
    "ats_score": 
}}

Note:
- ATS (Applicant Tracking System) score out of 100 as ats_score
- There can be multiple entries in `experience` and `education`.
- Do not add or remove any key.
- Refer to the following resume:

{resume_text}
"""
        )
        
        clean_text = re.sub(r"^```json|```$", "", response.text.strip(), flags=re.MULTILINE)
        parsed_data = json.loads(clean_text)
        
        return jsonify({"analysis": parsed_data})
    except Exception as e:
        return jsonify({'error': f'Failed to extract text: {str(e)}'}), 500

if __name__ == "__main__":
    create_data_table()
    create_users_table()
    create_jobs_table()
    create_info_table()
    app.run(debug=True)

