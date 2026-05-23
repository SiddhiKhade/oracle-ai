from apscheduler.schedulers.background import BackgroundScheduler
from probe_engine import run_probe_cycle
import time

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(run_probe_cycle, 'interval', hours=24, id='daily_probe')
    scheduler.start()
    print("Scheduler started — probes run every 24 hours")
    return scheduler