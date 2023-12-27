using Dou.Misc.Attr;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace SGDS.Models
{
    [Table("User")]
    public partial class User : Dou.Models.UserBase {
        [ColumnDef( Display ="單位名稱")]
        public string Unit { set; get; }
        [ColumnDef(Display = "EMail")]
        public string EMail { set; get; }
        [ColumnDef(Display = "連絡電話")]
        public string Tel { set; get; }
        [ColumnDef(Display = "地址")]
        public string Address { set; get; }
    }
}