import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class AlterTable {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            
            stmt.executeUpdate("ALTER TABLE public.farmer_shop_products ADD COLUMN IF NOT EXISTS description TEXT;");
            stmt.executeUpdate("ALTER TABLE public.farmer_shop_products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'Units';");
            
            System.out.println("Columns added successfully");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
