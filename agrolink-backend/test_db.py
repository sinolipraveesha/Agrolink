import psycopg2

conn = psycopg2.connect(
    dbname="postgres",
    user="postgres.ufmhxrfopuaqmzbeqfxe",
    password="Shashin1234#",
    host="aws-1-ap-south-1.pooler.supabase.com",
    port="6543"
)

cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';")
columns = cur.fetchall()
for col in columns:
    print(col)

cur.close()
conn.close()
