import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class QueryProfiles {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://db.ufmhxrfopuaqmzbeqfxe.supabase.co:5432/postgres?sslmode=require";
        String user = "postgres";
        String password = "Shashin1234#";
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT full_name, email, role, status FROM public.profiles;")) {
            while (rs.next()) {
                 System.out.println(rs.getString("full_name") + " | " + rs.getString("email") + " | " + rs.getString("role") + " | " + rs.getString("status"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
