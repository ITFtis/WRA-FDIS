using Microsoft.Owin;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using Owin;
using SGDS.Controllers.Api;
using System;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Xml;
using System.IO;

[assembly: OwinStartup(typeof(SGDS.Startup))]

namespace SGDS
{
    
    public class Startup
    {
        internal static AppSet AppSet { get; set; }
        public void Configuration(IAppBuilder app)
        {

            // 如需如何設定應用程式的詳細資訊，請瀏覽 https://go.microsoft.com/fwlink/?LinkID=316888

            bool isDebug = false;
            // 如需如何設定應用程式的詳細資訊，請瀏覽 https://go.microsoft.com/fwlink/?LinkID=316888
            Dou.Context.Init(new Dou.DouConfig
            {
                //SystemManagerDBConnectionName = "DouModelContextExt",
                DefaultPassword = "1234@1qaz#EDC", //"1234@1qaz#EDC",
                //PasswordEncode = (p) =>
                //{
                //    return System.Web.Helpers.Crypto.HashPassword(p);
                //},
                //VerifyPassword = (ep, vp) =>
                //{
                //    return System.Web.Helpers.Crypto.VerifyHashedPassword(ep, vp);
                //},
                //LoggerExpired=13,
                SessionTimeOut = 20,
                SqlDebugLog = isDebug,
                AllowAnonymous = false,
                //LoginPage = new UrlHelper(System.Web.HttpContext.Current.Request.RequestContext).Action("DouLoginRemember", "User"),
                LoginPage = new UrlHelper(System.Web.HttpContext.Current.Request.RequestContext).Action("DouLogin", "User", new { }),
                LoggerListen = (log) =>
                {
                    if (log.WorkItem == Dou.Misc.DouErrorHandler.ERROR_HANDLE_WORK_ITEM)
                    {
                        Debug.WriteLine("DouErrorHandler發出的錯誤!!\n" + log.LogContent);
                        Logger.Log.For(null).Error("DouErrorHandler發出的錯誤!!\n" + log.LogContent);
                    }
                }
            });

            AppSet = DouHelper.Misc.DeSerializeObjectLoadJsonFile<AppSet>(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~/Config"), "AppSet.json"));

            // DbContext 的類別所產生單一物件，不能夠使用於多執行緒環境下
            // 所以在非有登入下(superdou)一次載入多元件可能會有同時create DbContext問題
            // 以下在第一次啟動時先create DbContext，避免多執行緒同時create DbContext
            //using (var cxt = WWF.Controllers.Api.Data.DataController.DbContext)
            //{
            //    cxt.GlobalPeriod.Find(DateTime.Now.Year);
            //}
            //new System.Threading.Thread(RunInitData).Start();
        }

        void RunInitData()
        {
            System.Threading.Thread.Sleep(2000);
            try
            {
                new CctvController().GetFmgAllCctvStation();
            }
            /*
             * 39會時有以下問題
             * 會有來源陣列不夠長。請檢查 srcIndex 與長度，以及陣列的下限。
             * */
            catch 
            {
                System.Threading.Thread.Sleep(2000);
                try
                {
                    new CctvController().GetFmgAllCctvStation();
                }
                catch
                {

                }
            }
            /*
             * StackTrace:    於 System.Linq.Parallel.QueryTaskGroupState.QueryEnd(Boolean userInitiatedDispose)
   於 System.Linq.Parallel.DefaultMergeHelper`2.System.Linq.Parallel.IMergeHelper<TInputOutput>.Execute()
   於 System.Linq.Parallel.MergeExecutor`1.Execute[TKey](PartitionedStream`2 partitions, Boolean ignoreOutput, ParallelMergeOptions options, TaskScheduler taskScheduler, Boolean isOrdered, CancellationState cancellationState, Int32 queryId)
   於 System.Linq.Parallel.PartitionedStreamMerger`1.Receive[TKey](PartitionedStream`2 partitionedStream)
   於 System.Linq.Parallel.ForAllOperator`1.WrapPartitionedStream[TKey](PartitionedStream`2 inputStream, IPartitionedStreamRecipient`1 recipient, Boolean preferStriping, QuerySettings settings)
   於 System.Linq.Parallel.UnaryQueryOperator`2.UnaryQueryOperatorResults.ChildResultsRecipient.Receive[TKey](PartitionedStream`2 inputStream)
   於 System.Linq.Parallel.UnaryQueryOperator`2.UnaryQueryOperatorResults.GivePartitionedStream(IPartitionedStreamRecipient`1 recipient)
   於 System.Linq.Parallel.QueryOperator`1.GetOpenedEnumerator(Nullable`1 mergeOptions, Boolean suppressOrder, Boolean forEffect, QuerySettings querySettings)
   於 System.Linq.Parallel.ForAllOperator`1.RunSynchronously()
   於 SGDS.Controllers.Api.CctvController.GetFmgAllCctvStation(String apiurlbase)
   於 SGDS.Startup.RunInitData()
   於 System.Threading.ExecutionContext.RunInternal(ExecutionContext executionContext, ContextCallback callback, Object state, Boolean preserveSyncCtx)
   於 System.Threading.ExecutionContext.Run(ExecutionContext executionContext, ContextCallback callback, Object state, Boolean preserveSyncCtx)
   於 System.Threading.ExecutionContext.Run(ExecutionContext executionContext, ContextCallback callback, Object state)
   於 System.Threading.ThreadHelper.ThreadStart()

InnerException: System.ArgumentException

Message: 來源陣列不夠長。請檢查 srcIndex 與長度，以及陣列的下限。

StackTrace:    於 System.Array.Copy(Array sourceArray, Int32 sourceIndex, Array destinationArray, Int32 destinationIndex, Int32 length, Boolean reliable)
   於 System.Collections.Generic.List`1.set_Capacity(Int32 value)
   於 System.Collections.Generic.List`1.EnsureCapacity(Int32 min)
   於 System.Collections.Generic.List`1.InsertRange(Int32 index, IEnumerable`1 collection)
   於 SGDS.Controllers.Api.CctvController.<>c__DisplayClass4_2.<GetFmgAllCctvStation>b__0(JToken s)
   於 System.Linq.Parallel.ForAllOperator`1.ForAllEnumerator`1.MoveNext(TInput& currentElement, Int32& currentKey)
   於 System.Linq.Parallel.ForAllSpoolingTask`2.SpoolingWork()
   於 System.Linq.Parallel.SpoolingTaskBase.Work()
   於 System.Linq.Parallel.QueryTask.BaseWork(Object unused)
   於 System.Threading.Tasks.Task.Execute()
             */
        }
    }
}
