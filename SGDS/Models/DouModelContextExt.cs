using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data.Entity;
using System.Linq;

namespace SGDS.Models
{
    public partial class DouModelContextExt :Dou.Models.ModelContextBase<User, Role>
    {
        public DouModelContextExt()
            : base("name=DouModelContextExt") 
        {
            //Database.SetInitializer<DouModelContextExt>(null);
        }


        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
        }
    }
}
