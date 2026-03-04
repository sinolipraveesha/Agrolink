import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CreateShopTable {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        String sql = "CREATE TABLE IF NOT EXISTS public.farmer_shop_products (" +
                     "id UUID PRIMARY KEY DEFAULT gen_random_uuid(), " +
                     "admin_id UUID REFERENCES public.profiles(id), " +
                     "name VARCHAR(255) NOT NULL, " +
                     "category VARCHAR(255), " +
                     "price DECIMAL(10, 2) NOT NULL, " +
                     "stock_quantity INTEGER NOT NULL, " +
                     "image_url VARCHAR(500), " +
                     "status VARCHAR(50) DEFAULT 'available', " +
                     "created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                     ");";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            stmt.executeUpdate(sql);
            System.out.println("Table farmer_shop_products created successfully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
